"""Small pre-norm, tied-embedding decoder. Implemented for this project."""
from __future__ import annotations
import math
from dataclasses import dataclass, asdict
import torch
from torch import nn
from torch.nn import functional as F

@dataclass
class ModelConfig:
    vocabSize: int
    blockSize: int = 48
    embedDim: int = 48
    heads: int = 4
    layers: int = 2

class Attention(nn.Module):
    def __init__(self,c):
        super().__init__(); self.heads=c.heads
        self.qkv=nn.Linear(c.embedDim,3*c.embedDim); self.proj=nn.Linear(c.embedDim,c.embedDim)
    def forward(self,x):
        b,t,c=x.shape
        q,k,v=self.qkv(x).chunk(3,dim=-1)
        q,k,v=[a.view(b,t,self.heads,c//self.heads).transpose(1,2) for a in (q,k,v)]
        scores=q@k.transpose(-2,-1)/math.sqrt(c//self.heads)
        mask=torch.ones(t,t,device=x.device,dtype=torch.bool).tril()
        weights=scores.masked_fill(~mask,float('-inf')).softmax(-1)
        return self.proj((weights@v).transpose(1,2).contiguous().view(b,t,c))

class Block(nn.Module):
    def __init__(self,c):
        super().__init__(); self.ln1=nn.LayerNorm(c.embedDim); self.attn=Attention(c)
        self.ln2=nn.LayerNorm(c.embedDim); self.fc=nn.Linear(c.embedDim,4*c.embedDim); self.proj=nn.Linear(4*c.embedDim,c.embedDim)
    def forward(self,x):
        x=x+self.attn(self.ln1(x)); return x+self.proj(F.gelu(self.fc(self.ln2(x)),approximate='tanh'))

class TinyTransformer(nn.Module):
    def __init__(self,c):
        super().__init__(); self.config=c
        self.token_embedding=nn.Embedding(c.vocabSize,c.embedDim)
        self.position_embedding=nn.Embedding(c.blockSize,c.embedDim)
        self.blocks=nn.ModuleList([Block(c) for _ in range(c.layers)])
        self.final_norm=nn.LayerNorm(c.embedDim)
        self.apply(self._init)
    def _init(self,module):
        if isinstance(module,(nn.Linear,nn.Embedding)):
            nn.init.normal_(module.weight,mean=0.,std=.02)
            if isinstance(module,nn.Linear) and module.bias is not None: nn.init.zeros_(module.bias)
    def forward(self,ids,targets=None):
        t=ids.shape[1]
        if not 0<t<=self.config.blockSize: raise ValueError('Context length out of range')
        x=self.token_embedding(ids)+self.position_embedding(torch.arange(t,device=ids.device))
        for block in self.blocks: x=block(x)
        logits=self.final_norm(x)@self.token_embedding.weight.T
        loss=None if targets is None else F.cross_entropy(logits.reshape(-1,self.config.vocabSize),targets.reshape(-1),ignore_index=-100)
        return logits,loss
    @property
    def parameter_count(self): return sum(p.numel() for p in self.parameters())

    @torch.no_grad()
    def generate(self,vocab,prompt,temperature=.8,top_k=12,seed=7,max_new_tokens=80):
        stoi={ch:i for i,ch in enumerate(vocab)}; ids=[1]+[stoi.get(ch,0) for ch in prompt]
        # Same explicit PRNG used by the browser, independent from training RNG.
        state=seed&0xffffffff
        def uniform():
            nonlocal state
            state=(state+0x6D2B79F5)&0xffffffff
            t=((state^(state>>15))*(state|1))&0xffffffff
            t=(t^((t+(((t^(t>>7))*(t|61))&0xffffffff))&0xffffffff))&0xffffffff
            return ((t^(t>>14))&0xffffffff)/4294967296
        out=prompt
        for _ in range(max_new_tokens):
            logits=self(torch.tensor([ids[-self.config.blockSize:]]))[0][0,-1].double().numpy()
            import numpy as np
            logits[0:2]=-np.inf
            if temperature==0: nxt=int(np.argmax(logits))
            else:
                logits/=temperature
                if top_k>0:
                    order=np.argsort(-logits,kind='stable'); logits[order[min(top_k,len(logits)):]]=-np.inf
                probs=np.exp(logits-np.max(logits)); probs/=sum(probs)
                roll=uniform(); cumulative=0; nxt=len(probs)-1
                for i,p in enumerate(probs):
                    cumulative+=p
                    if roll<cumulative: nxt=i; break
            ids.append(nxt)
            if nxt==2: break
            out+=vocab[nxt]
        return out

    def export_weights(self):
        return {name:{'shape':list(value.shape),'data':value.detach().cpu().flatten().tolist()} for name,value in self.state_dict().items()}
