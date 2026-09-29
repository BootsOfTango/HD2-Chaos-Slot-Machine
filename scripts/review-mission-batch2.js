'use strict';
// Review-only generated contact sheets; original pixels are not resized.
const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'../.test-data/mission-game-icon-sources');
const rows=JSON.parse(fs.readFileSync(path.join(root,'batch2-review.json'),'utf8'));
for(let batch=0;batch<2;batch++){
  const sheet=new PNG({width:3*450,height:4*170});sheet.data.fill(32);
  rows.slice(batch*12,batch*12+12).forEach((row,i)=>{
    const png=PNG.sync.read(fs.readFileSync(path.join(root,'originals',row.sourceFile)));
    PNG.bitblt(png,sheet,0,0,Math.min(png.width,440),160,(i%3)*450,Math.floor(i/3)*170);
    console.log(batch*12+i,row.id,png.width,png.height);
  });
  fs.writeFileSync(path.join(root,'batch2-headers-'+batch+'.png'),PNG.sync.write(sheet));
}
