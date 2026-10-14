import {describe,it,expect} from 'vitest';
import {contextWindow,pickProbability} from '../src/lib/diagramMath';
describe('structural context diagram',()=>{
  const tokens=['<bos>',...'the cat'];
  it('separates future and cropped past; resets positions',()=>{
    const cells=contextWindow(tokens,6,3);
    expect(cells.filter(x=>x.state==='visible').map(x=>[x.position,x.windowPosition])).toEqual([[4,0],[5,1],[6,2]]);
    expect(cells[7]).toMatchObject({target:true,state:'future',windowPosition:null});
    expect(cells[0].state).toBe('older');
  });
  it('keeps BOS for the first prediction',()=>expect(contextWindow(tokens,0,5).filter(x=>x.state==='visible').map(x=>x.token)).toEqual(['<bos>']));
  it('rejects invalid positions',()=>{expect(()=>contextWindow(tokens,7,3)).toThrow();expect(()=>contextWindow(tokens,2,0)).toThrow();});
});
describe('visible one-draw probability illustration',()=>{
  it('uses vocabulary order and skips zero probability',()=>{expect(pickProbability([0,0,.2,.3,.5],0)).toBe(2);expect(pickProbability([0,0,.2,.3,.5],.2)).toBe(3);expect(pickProbability([0,0,.2,.3,.5],.5)).toBe(4);});
  it('handles greedy and final interval',()=>{expect(pickProbability([0,1,0],.999)).toBe(1);expect(pickProbability([.5,.5,0],.9999)).toBe(1);});
  it('rejects invalid distributions and endpoints',()=>{for(const p of [[0,0],[.5,-.1],[NaN,1]])expect(()=>pickProbability(p,.5)).toThrow();expect(()=>pickProbability([1],1)).toThrow();});
});
