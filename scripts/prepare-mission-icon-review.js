// One-off source inspection only. Pixel crops, no redraw, recolor or segmentation.
const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const names=['Launch_ICBM_Description_Helldive','Retrieve_Valuable_Data_Description_Helldive','Emergency_Evacuation_Automaton_Description_Helldive','Blitz_Search_And_Destroy_Automaton_Description_Helldive','Blitz_Search_And_Destroy_Terminid_Description_Helldive','Conduct_Geological_Survey_Description_Helldive','Destroy_Command_Bunkers_Description_Helldive','Destroy_Transmission_Network_Description_Medium','Eliminate_Automaton_Hulks_Description_Medium','Eliminate_Bile_Titans_Description_Challenging','Eliminate_Brood_Commanders_Description_Easy','Eliminate_Chargers_Description_Medium','Eliminate_Devastators_Description_Easy','Activate_E-710_Pumps_Description_Medium','Enable_E-710_Extraction_Description_Helldive','Pump_Fuel_To_ICBM_Description_Trivial','Purge_Hatcheries_Description_Helldive','Neutralize_Orbital_Defenses_Description_Helldive','Sabotage_Air_Base_Description_Helldive','Sabotage_Supply_Bases_Description_Medium','Spread_Democracy_Description_Helldive','Terminate_Illegal_Broadcast_Description_Easy','Upload_Escape_Pod_Data_Description_Medium'];
const out=path.resolve(__dirname,'../.test-data/mission-game-icon-sources');fs.mkdirSync(out,{recursive:true});
const sheet=new PNG({width:6*190,height:4*150});sheet.data.fill(32);
names.forEach((name,i)=>{const file=path.join(out,'originals',name+'.png');const image=PNG.sync.read(fs.readFileSync(file));
  PNG.bitblt(image,sheet,0,0,180,140,(i%6)*190,Math.floor(i/6)*150);
  console.log(i,name,image.width,image.height);
});
fs.writeFileSync(path.join(out,'source-headers.png'),PNG.sync.write(sheet));
