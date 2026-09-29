// Original operation-name vocabulary. No copied lists of official operation titles.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HD2RunLexicon=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const words=s=>Object.freeze(s.split(' '));
  const tiers=(...rows)=>Object.freeze(rows.map(words));
  const themes=Object.freeze({
    fire:tiers(
      'Ember Spark Kindled Glowing Smoldering Flickering Tinder Cinder Sooted Singed Toasted Coalbright Matchlit Ash-tipped Wicklit Heatkissed',
      'Scorch Searing Flare Charred Burning Blistering Torchlit Firebrand Redhot Furnace-fed Blazing Brandswept Coal-fired Flamebound Sootblack Kilnforged',
      'Wildfire Incendiary Pyroclastic Firestorm Scorching Charbroiled Cinderstorm Flamewrought Fireborne Furnaceborn Ashen Blazebound Napalm-fed Torchstorm Firewake Combustive',
      'Infernal Hellfire Conflagrant All-consuming Sunscorched Incinerating Pyroclasm Furnaceheart Blazeflood Ashbringer Cindermaw Firetide Hellblazing Worldscorch Embercataclysm Scorchquake'),
    gas:tiers(
      'Fumed Hazy Vaporous Mistbound Hissing Filtered Veiled Traceborne Clouded Wispbound Drifting Vented Fume-touched Seeping Haze-marked Vapor-traced',
      'Noxious Caustic Acrid Corrosive Toxic Fumigating Choking Gasbound Venomous Contaminated Canister-fed Fumeborne Cloudwreathed Masked Chemical Vapor-laden',
      'Miasmic Poisonous Saturating Suffocating Virulent Causticstorm Toxicborne Fumeflood Gaswreathed Corrosionbound Noxiouswake Miasma-clad Fumestorm Vaporblight Chokefog Venomwake',
      'Toxic-tempest Caustic-tide Miasmaheart Corrosionstorm Chokeflood Vaporcataclysm Fumemaelstrom Gasdeluge Blightcloud Venomstorm Noxiousdeluge Miasmaborn Chemical-torrent Fumebringer Causticmaw Vaporwrath'),
    arc:tiers(
      'Static Charged Crackling Sparking Buzzing Conductive Voltaic Pulsing Grounded Arc-touched Wirelit Coil-fed Copperbright Flickercharged Ticking Current-marked',
      'Arcing Jolting Shocking Livewire Galvanic Electric Voltage-fed Circuitcharged Discharging Overvolted Cracklebound Coilbright Thunder-touched Sparkborne Currentbound Arcwreathed',
      'Thunderous Lightningbound Stormcharged Thunderstruck Coilstorm Arcstorm Surgeborne Voltstorm Chaincharged Stormwired Thunderforged Overcharged Circuitstorm Fulminant Stormcoil Arcborne',
      'Thunderwrath Stormheart Lightningflood Arc-tempest Voltaic-deluge Thundermaw Circuitcataclysm Stormbringer Overload Lightning-tide Voltcataclysm Coilmaelstrom Thunderquake Arc-apocalypse Surgeheart Stormcrowned'),
    energy:tiers(
      'Glimmering Beam-touched Luminous Focused Radiant Prism-lit Photon-marked Laser-tipped Lensbright Pulsed Glinting Coherent Brightline Raybound Chargelight Flickerbeam',
      'Laserbound Plasma-lit Photon-fed Beamforged Radiating Ionbright Prismatic Raywrought Lensfocused Pulsebound Lightborne Beamcharged Hotbeam Plasma-touched Photonbright Rayburned',
      'Plasmaforged Beamstorm Radiancebound Laserborne Photonstorm Pulsefire Lightstorm Raystorm Plasmawrought Radiantwake Beamwreathed Prismstorm Sunbright Star-lit Energy-laden Pulsewrought',
      'Radiant-tempest Plasmaheart Photonflood Beamdeluge Starfire Lightcataclysm Plasma-tide Radiancewrath Prismheart Photonmaelstrom Beaminferno Lightbringer Raycataclysm Pulse-tempest Starbright Plasmawrath'),
    explosive:tiers(
      'Fused Primed Loaded Capped Breaching Powdered Blast-tipped Shrapnel-touched Shellmarked Det-cord Blast-ready Fuse-lit Fragmented Percussive Shellbound Charge-set',
      'Explosive Shellfire Detonating Concussive Fragmenting Blastbound Powderburned Breachcharged Grenadier Shellburst Blastwrought Rocket-fed Shrapnelborne Bomb-laden Ordnance-fed Blastborne',
      'Bombarding Thunderblast Shellstorm Barragebound Blastwave Detonation Shrapnelstorm Saturation Rocketstorm Demolishing Bombardment Breachstorm Ordnance-heavy Shellwrought Blastfront Cratering',
      'Cataclysmic Obliterating Demolitionstorm Bombardment-born Detonation-tide Shellcataclysm Blastmaw Shrapnelflood Ordnance-tempest Cratermaker Breachquake Barrageheart Rocketdeluge Blastbringer Detonationwrath Shellmaelstrom')
  });
  const roles=Object.freeze({
    ballistic:words('Ironclad Belt-fed Brassbound Bulletborne Rifled Leadbound Hammering Relentless Magazine-fed Chambered Gunsmoke Steadfast Steel-jacketed Rapidfire Recoiling Triggerbound Suppressive Gunmetal Hardline Battleworn Repeating Battle-ready Unyielding Drum-fed'),
    precision:words('Eagle-eyed Pinpoint Surgical Watchful Deliberate Longshot Farseeing Patient Keen-eyed Deadcenter Scoped Suresight Crosshaired Rangebound Measured Sharpsighted Vigilant Calculated Needlepoint Steadyhand Farstrike Sighted Truebearing Calibrated'),
    defense:words('Entrenched Fortified Unbroken Shielded Armored Stalwart Ironbound Resolute Bastioned Braced Dug-in Redoubtable Guarded Bulwarked Unbowed Reinforced Anchored Indomitable Protected Steelsworn Towering Ramparted Steadied Emplaced'),
    mobility:words('Swift Fleetfoot Rapid Airborne Vaulting Nimble Roaming Bounding Trailblazing Far-ranging Highflying Leaping Skimming Sprinting Windborne Unfettered Pacesetting Ranging Mobile Quickstep Unbound Longstride Pioneering Restless'),
    support:words('Provisioned Supplied Sustaining Watchstanding Resourceful Equipped Stocked Steadying Lifesaving Tireless Dutiful Prepared Reliable Restoring Replenishing Resourceborne Rallying Reinforcing Ready-minded Constant Practical Mission-ready Dependable Committed'),
    mixed:words('Patriotic Democratic Uncompromising Valiant Fearless Defiant Gallant Dauntless Audacious Unflinching Resolute Loyal Compliant Authorized Sanctioned Certified Unscheduled Improvised Expedient Tenacious Earnest Bold Stubborn Unshaken')
  });
  const factions=Object.freeze({
    Automatons:words('Ironfront Steelworks Foundry Gearworks Rivet Chrome Scrapline Ironwall Cobalt Anvil Assembly Steelmarch Ironclaw Furnace Circuit Rustbelt'),
    Terminids:words('Chitin Nestfront Carapace Swarmline Burrow Broodfront Talon Mandible Nestward Carapacefront Swarmbreak Burrowline Carapacemarch Hivefront Mandiblefront Talonline'),
    Illuminate:words('Veilfront Monolith Obelisk Prismfront Twilight Eclipse Voidward Mindfront Shroud Starveil Duskline Nightward Veilbreak Horizon Moonward Astral')
  });
  const environments=Object.freeze({
    heat:words('Ashfall Cinderland Lavabed Furnacefield Magmafront Charplain Emberfield Kilnland Basalt Scoria Ashland Blackrock Sootfield Cinderplain Burnscar Fireland'),
    cold:words('Frostline Icefield Tundra Snowbound Rimefield Glacial Snowdrift Permafrost Coldfront Icebound Frostmarch Rimewall Whiteout Snowline Icefall Winterfront'),
    desert:words('Dunefront Sandline Dustland Sandsea Aridland Dunecrest Dustmarch Sunward Sandstone Badlands Drywash Saltflat Duneward Dustfront Sunbaked Dustridge'),
    wet:words('Rainfront Mire Bogland Marshline Fenland Wetland Rainward Swampfront Mudline Downpour Reedland Siltfield Mudmarch Mirefront Floodplain Rainfall'),
    forest:words('Canopy Treeline Timberland Brushfront Greenward Woodline Thicket Rootland Verdant Branchline Fernland Underbrush Wildwood Leafward Rootfront Greenline'),
    acid:words('Acidland Causticfield Corrosionfront Sourland Acidplain Etchland Fumefield Acidmarch Corroded Sulfurfield Acidfall Sourfront Causticland Etchfront Sulfurplain Corrosionfield'),
    fog:words('Fogline Mistfront Hazeland Lowcloud Murkfield Fogbank Grayfront Mistward Hazeplain Fogward Mistbank Cloudbank Murkland Hazefront Grayland Fogmarch'),
    storm:words('Stormfront Tempest Thunderhead Squallfront Rainband Stormward Cloudfront Gale Lightningfield Cyclone Stormline Galecrest Stormwall Windfront Squallbank Cloudmarch'),
    urban:words('Cityfront Boulevard Courtyard Streetline Causeway Junction Township Plaza Rooftop Colony Brickline Pavement District Railhead Cityward Boulevardfront')
  });
  const missions=Object.freeze({
    defense:words('Gatewatch Holdfast Rampart Redoubt Bastion Shieldwall Lastline Strongpoint Watchpost Perimeter Garrison Bulwark'),
    evacuation:words('Lifeline Homeward Corridor Haven Safepassage Rescueward Beacon Refuge Departure Escortline Shelter Returnpath'),
    blitz:words('Breachfront Spearpoint Raidline Vanguard Dashfront Rushline Foray Spearhead Incursion Breakthrough Shockfront Assaultline'),
    eradicate:words('Sweepfront Clearzone Huntline Killzone Suppression Sweepward Fireline Huntward Interdiction Sweepfield Pursuitline Containment'),
    data:words('Uplink Archive Relay Datavault Signal Cipher Broadcast Antenna Transmission Telemetry Dataline Frequency'),
    objective:words('Launchsite Silo Fuelworks Drillsite Powerline Objective Worksite Relayfield Platform Launchline Workfront Siteward')
  });
  const general=words('Liberty Democracy Freedom Justice Citizen Patriot Ballot Duty Honor Courage Doctrine Frontier Expedition Planetfall Hellpod Destroyer Orbital Dropzone Frontline Warfront Campaign Requisition Victory Banner Oath Resolve Medal Service Gallantry Defiance Valor Republic');
  const endings=words('Mandate Directive Reckoning Protocol Verdict Decree Dispatch Warrant Edict Resolution Reprisal Crusade Offensive Stand Salute Promise Oath Pledge Accord Covenant Testimony Ultimatum Judgment Sentence Sanction Authorization Compliance Audit Quota Dividend Levy Ration Ledger Memorandum Petition Ratification Amendment Referendum Ordinance Declaration Charter Manifest Docket Requisition Order Commission Assignment Detail Watch Patrol Expedition Deployment Descent Gambit Gamble Trial Ordeal Vigil March Advance Counterstroke Reclamation Retaliation Deliverance Redemption Liberation Defiance Resolve Defenders Vanguard Standard Banner Anthem Chorus Testament Tribute Legacy Chronicle Chapter Fable Legend Ballad Reveille Muster Rollcall Rally Duty Service Vow Sacrifice Burden Folly Remedy Insurance Interest Receipt Endorsement Certification Obligation Induction Dedication Affirmation Custody Safeguard Redress Settlement Reckoner Adjudication Enactment Arbitration Supplication Acclamation Commitment Provision Campaign Intervention Maneuver Sortie Engagement Standby Initiative Venture Dispatchment Command Endeavor Undertaking Pursuit Undertow Reroute Countermarch Overture Lastword Accordance Notarization');
  return Object.freeze({version:1,themes,roles,factions,environments,missions,general,endings});
});
