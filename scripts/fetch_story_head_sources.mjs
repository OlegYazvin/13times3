import {mkdir,writeFile} from 'node:fs/promises';
const root='.cache/makehuman-head-sources';await mkdir(root,{recursive:true});
const sha='a8bc2d54ff0ac92e78ff71431b1023eda42bf482';
const files=['LICENSE.md','LICENSE.ASSETS.md','makehuman/data/3dobjs/base.obj',...['caucasian-female-baby','caucasian-female-child','caucasian-female-young','caucasian-female-old','caucasian-male-young','universal-female-baby-averagemuscle-averageweight','universal-female-child-averagemuscle-averageweight','universal-female-young-averagemuscle-averageweight','universal-female-old-averagemuscle-averageweight','universal-male-young-averagemuscle-averageweight'].map(n=>'makehuman/data/targets/macrodetails/'+n+'.target')];
for(const path of files){const url=`https://raw.githubusercontent.com/makehumancommunity/makehuman/${sha}/${path}`,r=await fetch(url);if(!r.ok)throw Error(r.status+' '+path);const bytes=Buffer.from(await r.arrayBuffer());await writeFile(root+'/'+path.split('/').at(-1),bytes);console.log(path.split('/').at(-1),bytes.length);}
await writeFile(root+'/source.json',JSON.stringify({repository:'https://github.com/makehumancommunity/makehuman',sha,files},null,2)+'\n');
