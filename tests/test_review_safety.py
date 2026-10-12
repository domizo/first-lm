import copy, json, tempfile, threading, time, unittest
from pathlib import Path
from unittest.mock import patch
import torch
from fastapi.testclient import TestClient
from model_lab import server
from model_lab.train import TrainConfig, train

class ReviewSafetyTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
        self.original=(server.RUNS,server.latest,server.current_dir,copy.copy(server.state),server.job_thread)
        server.RUNS=self.root;server.latest=self.root/'latest.json';server.current_dir=None;server.job_thread=None
        server.state.clear();server.state.update(status='idle',metrics=[]);server.cancel_event.clear()
        self.client=TestClient(server.app,base_url='http://127.0.0.1:8765')
    def tearDown(self):
        server.cancel_event.set()
        if server.job_thread is not None:server.job_thread.join(timeout=15)
        server.RUNS,server.latest,server.current_dir,old,server.job_thread=self.original
        server.state.clear();server.state.update(old)
        self.client.close();self.tmp.cleanup()
    def await_terminal(self):
        deadline=time.monotonic()+15
        while time.monotonic()<deadline:
            result=self.client.get('/api/status').json()
            if result['status']!='running':return result
            time.sleep(.02)
        self.fail('Trainer did not terminate within 15 seconds')
    def test_hosts_and_origins(self):
        for headers in [{'host':'evil.test'},{'origin':'https://evil.test'},{'origin':'null'},{'origin':'http://localhost:garbage'},{'origin':'http://localhost:9999'}]:
            self.assertEqual(self.client.get('/api/health',headers=headers).status_code,403,headers)
        for headers in [{},{'host':'localhost:8765'},{'origin':'http://127.0.0.1:8765'},{'origin':'http://localhost:5173'}]:
            self.assertEqual(self.client.get('/api/health',headers=headers).status_code,200,headers)
    def test_oversize_content_length_and_stream(self):
        r=self.client.post('/api/train',content=b'{}',headers={'content-type':'application/json','content-length':'110001'})
        self.assertEqual(r.status_code,413)
        r=self.client.post('/api/train',content=iter([b' '*60000,b' '*60000]),headers={'content-type':'application/json'})
        self.assertEqual(r.status_code,413)
        self.assertEqual(server.state['status'],'idle')
    def test_content_type_and_validation(self):
        self.assertEqual(self.client.post('/api/train',content='{}').status_code,415)
        for body in [[], {'steps':1001},{'steps':True},{'embedDim':4096},{'corpus':'a'*100001},{'output':'/tmp/outside'},{'checkpointPath':'/etc/passwd'},{'resume':'yes'},{'corpus':12},{'device':'cuda'}]:
            r=self.client.post('/api/train',json=body)
            self.assertEqual(r.status_code,422,(body,r.text))
        self.assertEqual(self.client.post('/api/train',content='{',headers={'content-type':'application/json'}).status_code,422)
    def test_actual_cancel_resume_and_concurrency(self):
        config={'steps':60,'evalEvery':10,'embedDim':16,'heads':2,'layers':1,'blockSize':16,'batchSize':4}
        start=self.client.post('/api/train',json=config)
        self.assertEqual(start.status_code,202,start.text)
        self.assertEqual(self.client.post('/api/train',json=config).status_code,409)
        self.assertEqual(self.client.get('/api/bundle').status_code,409)
        self.assertEqual(self.client.post('/api/cancel',json={}).status_code,200)
        result=self.await_terminal();self.assertEqual(result['status'],'cancelled',result)
        saved=json.loads((server.current_dir/'bundle.json').read_text())
        self.assertEqual(saved['status'],'cancelled')
        self.assertEqual(saved['metrics'][-1]['step'],result['metrics'][-1]['step'])
        self.assertEqual(self.client.post('/api/cancel',json={}).status_code,409)
        resume=self.client.post('/api/train',json={**config,'resume':True})
        self.assertEqual(resume.status_code,202,resume.text)
        result=self.await_terminal();self.assertEqual(result['status'],'completed',result)
        self.assertEqual(result['metrics'][-1]['step'],60)
        self.assertTrue((server.current_dir/'checkpoint.pt').exists())
        self.assertEqual(self.client.post('/api/train',json={**config,'resume':True}).status_code,422)
    def test_custom_corpus_roundtrip_and_resume(self):
        corpus='\n\n'.join(f'a small original custom document number {i}.' for i in range(20))
        config={'steps':2,'evalEvery':2,'embedDim':16,'heads':2,'layers':1,'blockSize':16,'batchSize':4}
        self.assertEqual(self.client.post('/api/train',json={**config,'corpus':corpus}).status_code,202)
        first=self.await_terminal();self.assertEqual(first['status'],'completed')
        self.assertEqual(first['bundle']['dataset']['name'],'User-provided local corpus')
        restored=self.client.get('/api/dataset').json()['text']
        from model_lab.data import parse_corpus
        self.assertEqual(parse_corpus(restored),parse_corpus(corpus))
        self.assertEqual(self.client.post('/api/train',json={**config,'steps':4,'corpus':restored,'resume':True}).status_code,202)
        second=self.await_terminal();self.assertEqual(second['status'],'completed')
        self.assertEqual(second['runId'],first['runId'])
        self.assertEqual(second['bundle']['metrics'][-1]['step'],4)

    def test_terminal_callback_sees_persisted_checkpoint(self):
        directory=self.root/'direct'; observed=[]
        def update(bundle):
            if bundle['status']!='running':
                disk=json.loads((directory/'bundle.json').read_text())
                saved=torch.load(directory/'checkpoint.pt',map_location='cpu',weights_only=True)
                observed.append((bundle['status'],disk['status'],saved['step']))
        train(TrainConfig(steps=3,evalEvery=2,embedDim=16,heads=2,layers=1,blockSize=16,batchSize=4),directory,on_update=update)
        self.assertEqual(observed,[('completed','completed',3)])
    def test_failed_custom_corpus_preserves_latest_saved_run(self):
        config={'steps':2,'evalEvery':1,'embedDim':16,'heads':2,'layers':1,'blockSize':16,'batchSize':4}
        self.assertEqual(self.client.post('/api/train',json=config).status_code,202)
        previous=self.await_terminal()
        self.assertEqual(previous['status'],'completed')
        pointer=server.latest.read_text()
        directory=server.current_dir
        invalid_corpora=[
            '\n\n'.join(['the same repeated document.']*10),
            '\n\n'.join([f'document {i} '+''.join(chr(0x400+j) for j in range(510)) for i in range(10)]),
        ]
        for corpus in invalid_corpora:
            response=self.client.post('/api/train',json={**config,'corpus':corpus})
            self.assertEqual(response.status_code,422,response.text)
            self.assertEqual(server.latest.read_text(),pointer)
            self.assertEqual(server.current_dir,directory)
            self.assertEqual(server.state['runId'],previous['runId'])
            self.assertTrue((directory/'checkpoint.pt').is_file())
    def test_many_resumes_retain_bounded_ordered_snapshots(self):
        directory=self.root/'many'
        for step in range(1,11):
            result=train(TrainConfig(steps=step,evalEvery=2,embedDim=16,heads=2,layers=1,blockSize=16,batchSize=4),directory,resume=step>1)
            steps=[x['step'] for x in result['checkpoints']]
            self.assertLessEqual(len(steps),8);self.assertEqual(steps,sorted(set(steps)));self.assertEqual(steps[0],0);self.assertEqual(steps[-1],step)
    def test_weights_only_rejects_untrusted_execution(self):
        marker=self.root/'executed'
        path=self.root/'untrusted.pt'
        class Payload:
            def __reduce__(self):return (_write_marker,(str(marker),))
        torch.save(Payload(),path)
        with self.assertRaises(Exception):torch.load(path,map_location='cpu',weights_only=True)
        self.assertFalse(marker.exists())

def _write_marker(path):Path(path).write_text('Executed malicious checkpoint')

if __name__=='__main__':unittest.main(verbosity=2)
