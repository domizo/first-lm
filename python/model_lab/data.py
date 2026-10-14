"""Original toy corpus and leakage-conscious document-first splitting."""
from __future__ import annotations
import hashlib, json, random
from dataclasses import dataclass
from pathlib import Path
import numpy as np

SPECIAL = ['<unk>', '<bos>', '<eos>']
MAX_CORPUS_BYTES = 100_000


def original_corpus() -> list[str]:
    # These sentences were written for this project, not copied or scraped.
    animals = [('cat', 'ねこ'), ('dog', 'いぬ'), ('bird', 'とり'), ('rabbit', 'うさぎ'), ('fox', 'きつね'), ('bear', 'くま')]
    colors = [('red', 'あかい'), ('blue', 'あおい'), ('green', 'みどりの'), ('white', 'しろい')]
    places = [('garden', 'にわ'), ('forest', 'もり'), ('house', 'いえ'), ('park', 'こうえん')]
    objects = [('ball', 'ボール'), ('flower', 'はな'), ('leaf', 'はっぱ')]
    docs=[]
    for animal,ja_animal in animals:
        for color,ja_color in colors:
            for place,ja_place in places:
                for obj,ja_obj in objects:
                    docs.append(f'the {animal} is in the {place}. the {animal} sees a {color} {obj}. the {animal} is happy.\n')
                    docs.append(f'{ja_animal}は{ja_place}にいます。{ja_animal}は{ja_color}{ja_obj}をみます。{ja_animal}はうれしいです。\n')
    return docs


def parse_corpus(text: str) -> list[str]:
    if not isinstance(text,str) or len(text.encode('utf-8')) > MAX_CORPUS_BYTES:
        raise ValueError('Corpus must be UTF-8 text at most 100 KB.')
    docs = [x.strip()+'\n' for x in text.replace('\r\n','\n').split('\n\n') if x.strip()]
    if len(docs)<10 or len(docs)>2000 or any(len(x)<8 or len(x)>4000 for x in docs):
        raise ValueError('Provide 10–2,000 documents separated by blank lines, each 8–4,000 characters.')
    return docs


@dataclass
class Dataset:
    docs: list[str]
    train_docs: list[str]
    validation_docs: list[str]
    vocab: list[str]
    train: list[list[int]]
    validation: list[list[int]]
    metadata: dict


def prepare_dataset(docs: list[str] | None = None, seed: int = 17) -> Dataset:
    original_docs = original_corpus()
    original = docs is None or docs == original_docs
    docs = original_docs if original else docs
    # Deduplicate BEFORE splitting: an identical document cannot cross partitions.
    docs = list(dict.fromkeys(docs))
    if len(docs)<10: raise ValueError('At least ten unique documents are needed.')
    order = list(range(len(docs))); random.Random(seed).shuffle(order)
    n_val=max(1,round(len(docs)*.2))
    validation_docs=[docs[i] for i in order[:n_val]]
    train_docs=[docs[i] for i in order[n_val:]]
    vocab=SPECIAL+sorted(set(''.join(train_docs)))
    if len(vocab)>512: raise ValueError('At most 509 distinct training characters are supported.')
    stoi={ch:i for i,ch in enumerate(vocab)}
    def encode(doc): return [1]+[stoi.get(ch,0) for ch in doc]+[2]
    train=[encode(x) for x in train_docs]; validation=[encode(x) for x in validation_docs]
    digest=hashlib.sha256(json.dumps(docs,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    metadata=dict(name='Original bilingual toy scenes' if original else 'User-provided local corpus',
        license='MIT; original project-authored demo text (see LICENSE)' if original else 'User is responsible for rights to supplied text',
        provenance='Project-authored template sentences; no downloaded corpus.' if original else 'Submitted to the loopback companion by the user; never uploaded by this app.',
        sha256=digest,trainDocuments=len(train),validationDocuments=len(validation),
        trainTokens=sum(map(len,train)),validationTokens=sum(map(len,validation)),
        unknownValidationTokens=sum(t==0 for doc in validation for t in doc),splitSeed=seed,
        splitMethod='Deduplicate exact documents, seeded 80/20 document split, then windows within each document; character vocabulary from training only.',
        trainPreview='\n'.join(train_docs[:3]),validationPreview='\n'.join(validation_docs[:3]),
        limitations='Highly repetitive templates share vocabulary and structure across splits. Held-out documents test new combinations, not general language understanding. This is not a chatbot.' if original else 'Small user corpus; validation does not prove general language ability. Near-duplicate documents are not detected automatically.')
    return Dataset(docs,train_docs,validation_docs,vocab,train,validation,metadata)


def batch(documents, batch_size, block_size, rng):
    x=np.full((batch_size,block_size),2,dtype=np.int64)
    y=np.full((batch_size,block_size),-100,dtype=np.int64)
    for i in range(batch_size):
        doc=documents[int(rng.integers(len(documents)))]
        start=int(rng.integers(max(1,len(doc)-1)))
        window=doc[start:start+block_size+1]
        length=len(window)-1
        x[i,:length]=window[:-1]; y[i,:length]=window[1:]
    return x,y


def bigram_baseline(dataset: Dataset, eval_batches):
    counts=np.full((len(dataset.vocab),len(dataset.vocab)),.1)
    for doc in dataset.train:
        for a,b in zip(doc,doc[1:]): counts[a,b]+=1
    probs=counts/counts.sum(axis=1,keepdims=True)
    def loss(batches):
        losses=[]
        for x,y in batches:
            keep=y!=-100
            losses.extend(-np.log(probs[x[keep],y[keep]]))
        return float(np.mean(losses))
    return {'type':'bigram','smoothing':.1,'trainLoss':loss(eval_batches['train']),'validationLoss':loss(eval_batches['validation'])}
