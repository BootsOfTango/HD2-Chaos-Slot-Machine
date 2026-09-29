'use strict';
// Original code-native geometric mark; no game/publisher artwork or fonts imported.
const glyphs={
 H:['10001','10001','10001','11111','10001','10001','10001'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 '2':['11110','00001','00001','01110','10000','10000','11111'],
 C:['01111','10000','10000','10000','10000','10000','01111'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 S:['01111','10000','10000','01110','00001','00001','11110'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
 M:['10001','11011','10101','10101','10001','10001','10001'],
 I:['11111','00100','00100','00100','00100','00100','11111'],
 N:['10001','11001','11001','10101','10011','10011','10001'],
 E:['11111','10000','10000','11110','10000','10000','11111']
};
function geometry(){
 const shapes=[];const rect=(x,y,w,h,fill)=>shapes.push({x,y,w,h,fill});
 rect(8,4,222,248,'#020303');rect(14,10,210,236,'#626b70');rect(18,14,202,228,'#20262a');
 rect(24,20,190,5,'#ffe400');rect(24,230,190,6,'#ffe400');rect(228,83,12,106,'#020303');rect(231,87,6,98,'#808b90');rect(224,53,26,32,'#020303');rect(229,58,16,22,'#ffe400');
 rect(25,32,187,171,'#090d0e');rect(29,36,179,163,'#343a3b');
 const text=(word,y,scale)=>{
   const x=119-(word.length*6-1)*scale/2;
   const pixels=[];Array.from(word).forEach((letter,i)=>glyphs[letter].forEach((row,j)=>Array.from(row).forEach((bit,k)=>{if(bit==='1')pixels.push([x+(i*6+k)*scale,y+j*scale]);})));
   for(const [px,py]of pixels)rect(px-1,py-1,scale+2,scale+2,'#000000');
   for(const [px,py]of pixels)rect(px,py,scale,scale,'#ffe400');
 };
 text('HD2',40,5);text('CHAOS',83,4);text('SLOT',121,4);text('MACHINE',159,4);
 for(const x of [64,103,142]){rect(x,209,31,15,'#000000');rect(x+4,213,23,7,'#ffe400');}
 return shapes;
}
function svg(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title desc"><title id="title">HD2 Chaos Slot Machine</title><desc id="desc">Original dark slot machine with yellow, black-outlined HD2 CHAOS SLOT MACHINE lettering.</desc>${geometry().map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}"/>`).join('')}</svg>\n`;}
function png(){const {PNG}=require('pngjs');const image=new PNG({width:256,height:256});image.data.fill(0);for(const r of geometry()){const color=[1,3,5].map(i=>parseInt(r.fill.slice(i,i+2),16));for(let y=Math.ceil(r.y);y<r.y+r.h;y++)for(let x=Math.ceil(r.x);x<r.x+r.w;x++){const offset=(y*256+x)*4;image.data.set([...color,255],offset);}}return PNG.sync.write(image);}
module.exports={geometry,svg,png};
