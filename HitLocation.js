// Hit Location API — Only Show Selected Facing
// Command: !hit [front|back] [region] attacker:"Name" weapon:"Name"
// Public output only

on("ready", () => {
  "use strict";

  const MAJOR = [
    { key: "head",  w: 10, title: "Head/Neck" },
    { key: "upper", w: 25, title: "Upper Torso" },
    { key: "lower", w: 20, title: "Lower Torso" },
    { key: "arm",   w: 14, title: "Arm" },
    { key: "groin", w:  6, title: "Groin/Pelvis" },
    { key: "leg",   w: 25, title: "Leg" }
  ];

  const pickWeighted = (arr) => {
    const total = arr.reduce((s, x) => s + x.w, 0);
    let r = randomInteger(total);
    for (let i = 0; i < arr.length; i++) {
      r -= arr[i].w;
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  };

  const getArg = (s, k, d) => {
    const re = new RegExp(k + ':"([^"]+)"', "i");
    const m = s.match(re);
    return m ? m[1] : d;
  };

  // Data tables (ASCII only; no curly quotes, no special symbols)
  // Each entry: {f: "Front text", b: "Back text", w: weight, mult: "xX", note: "..."}

  const TABLES = {
    head: {
      title: "Head/Neck",
      front: [
        {f:"Scalp / Forehead (upper)", b:"Crown / Top of Head", w:10, mult:"x1.5", note:"Hard, bony surface; glancing hits common."},
        {f:"Left Temple", b:"Left Parietal (upper rear)", w:6, mult:"x2.0", note:"Thin bone near arteries; disorienting."},
        {f:"Right Temple", b:"Right Parietal (upper rear)", w:6, mult:"x2.0", note:"Thin bone near arteries; disorienting."},
        {f:"Left Eye / Brow", b:"Left Occipital Ridge", w:5, mult:"x3.0", note:"Fragile; risk of blindness or concussion."},
        {f:"Right Eye / Brow", b:"Right Occipital Ridge", w:5, mult:"x3.0", note:"Fragile; risk of blindness or concussion."},
        {f:"Nose / Nasal Bridge", b:"Upper Rear Skull", w:3, mult:"x2.5", note:"Central but narrow target; high bleeding."},
        {f:"Left Cheek / Zygomatic", b:"Left Rear Jawline", w:5, mult:"x1.5", note:"Facial strike; fracture/disfigure risk."},
        {f:"Right Cheek / Zygomatic", b:"Right Rear Jawline", w:5, mult:"x1.5", note:"Facial strike; fracture/disfigure risk."},
        {f:"Mouth / Lips", b:"Base of Skull (occipital junction)", w:4, mult:"x2.0", note:"Soft tissue; internal bleeding possible."},
        {f:"Chin / Lower Jaw", b:"Rear Jaw / Mandible Base", w:6, mult:"x2.0", note:"High concussive potential; knockout zone."},
        {f:"Throat / Adam's Apple", b:"Upper Neck (nape)", w:5, mult:"x3.0", note:"Extremely vulnerable; airway and artery."},
        {f:"Left Ear", b:"Left Mastoid / Rear Ear", w:4, mult:"x1.5", note:"Easy to rupture; balance disruption."},
        {f:"Right Ear", b:"Right Mastoid / Rear Ear", w:4, mult:"x1.5", note:"Easy to rupture; balance disruption."},
        {f:"Left Side of Neck", b:"Left Rear Neck", w:6, mult:"x2.5", note:"Jugular/nerve risk; serious if pierced."},
        {f:"Right Side of Neck", b:"Right Rear Neck", w:6, mult:"x2.5", note:"Jugular/nerve risk; serious if pierced."}
      ],
      back: [
        {f:"Scalp / Forehead (upper)", b:"Crown / Top of Head", w:10, mult:"x1.5", note:"Hard, bony surface; glancing hits common."},
        {f:"Left Temple", b:"Left Parietal (upper rear)", w:6, mult:"x2.0", note:"Thin bone near arteries; disorienting."},
        {f:"Right Temple", b:"Right Parietal (upper rear)", w:6, mult:"x2.0", note:"Thin bone near arteries; disorienting."},
        {f:"Left Eye / Brow", b:"Left Occipital Ridge", w:5, mult:"x3.0", note:"Fragile; risk of blindness or concussion."},
        {f:"Right Eye / Brow", b:"Right Occipital Ridge", w:5, mult:"x3.0", note:"Fragile; risk of blindness or concussion."},
        {f:"Nose / Nasal Bridge", b:"Upper Rear Skull", w:3, mult:"x2.5", note:"Central but narrow target; high bleeding."},
        {f:"Left Cheek / Zygomatic", b:"Left Rear Jawline", w:5, mult:"x1.5", note:"Facial strike; fracture/disfigure risk."},
        {f:"Right Cheek / Zygomatic", b:"Right Rear Jawline", w:5, mult:"x1.5", note:"Facial strike; fracture/disfigure risk."},
        {f:"Mouth / Lips", b:"Base of Skull (occipital junction)", w:4, mult:"x2.0", note:"Soft tissue; internal bleeding possible."},
        {f:"Chin / Lower Jaw", b:"Rear Jaw / Mandible Base", w:6, mult:"x2.0", note:"High concussive potential; knockout zone."},
        {f:"Throat / Adam's Apple", b:"Upper Neck (nape)", w:5, mult:"x3.0", note:"Extremely vulnerable; airway and artery."},
        {f:"Left Ear", b:"Left Mastoid / Rear Ear", w:4, mult:"x1.5", note:"Easy to rupture; balance disruption."},
        {f:"Right Ear", b:"Right Mastoid / Rear Ear", w:4, mult:"x1.5", note:"Easy to rupture; balance disruption."},
        {f:"Left Side of Neck", b:"Left Rear Neck", w:6, mult:"x2.5", note:"Jugular/nerve risk; serious if pierced."},
        {f:"Right Side of Neck", b:"Right Rear Neck", w:6, mult:"x2.5", note:"Jugular/nerve risk; serious if pierced."},
        {f:"-", b:"Back of Head (central occiput)", w:8, mult:"x2.0", note:"Heavy bone; skull fracture risk."}
      ]
    },

    upper: {
      title: "Upper Torso",
      front: [
        {f:"Upper Chest (center)", b:"Upper Back (thoracic spine)", w:15, mult:"x2.5", note:"Heart, lungs, major vessels; core zone."},
        {f:"Left Pectoral", b:"Left Upper Back / Shoulder Blade", w:10, mult:"x2.5", note:"Over heart; high lethality."},
        {f:"Right Pectoral", b:"Right Upper Back / Shoulder Blade", w:10, mult:"x2.0", note:"Over right lung."},
        {f:"Sternum / Solar Plexus", b:"Upper Spine (between shoulder blades)", w:8, mult:"x2.0", note:"Central strike; wind/stun."},
        {f:"Left Shoulder / Clavicle", b:"Left Shoulder Rear", w:7, mult:"x1.5", note:"Joint; mobility loss."},
        {f:"Right Shoulder / Clavicle", b:"Right Shoulder Rear", w:7, mult:"x1.5", note:"Joint; mobility loss."},
        {f:"Left Ribcage (upper)", b:"Left Upper Rib / Latissimus", w:6, mult:"x1.5", note:"Protects lung; flexible."},
        {f:"Right Ribcage (upper)", b:"Right Upper Rib / Latissimus", w:6, mult:"x1.5", note:"Protects lung."},
        {f:"Left Armpit", b:"Left Rear Axilla", w:4, mult:"x2.5", note:"Arteries/nerve bundle."},
        {f:"Right Armpit", b:"Right Rear Axilla", w:4, mult:"x2.5", note:"Arteries/nerve bundle."},
        {f:"Collarbone (center)", b:"Upper Back of Neck", w:5, mult:"x1.5", note:"Fracture can disable arm."},
        {f:"Left Side of Chest (under arm)", b:"Left Rear Rib Flank", w:4, mult:"x1.2", note:"Semi-protected zone."},
        {f:"Right Side of Chest (under arm)", b:"Right Rear Rib Flank", w:4, mult:"x1.2", note:"Semi-protected zone."},
        {f:"Left Breast (if present)", b:"Left Rear Rib Upper", w:2, mult:"x1.0", note:"Superficial small area."},
        {f:"Right Breast (if present)", b:"Right Rear Rib Upper", w:2, mult:"x1.0", note:"Superficial small area."}
      ],
      back: [] // same as front, mirrored output; keeping identical weights and text is fine
    },

    lower: {
      title: "Lower Torso",
      front: [
        {f:"Upper Abdomen / Solar Plexus", b:"Upper Lower Back (thoracolumbar junction)", w:12, mult:"x2.0", note:"Wind/knockdown potential."},
        {f:"Mid Abdomen / Stomach", b:"Mid Lower Back (lumbar muscles)", w:8, mult:"x2.5", note:"Soft tissue / internal injury risk."},
        {f:"Lower Abdomen / Lower Gut", b:"Lower Back / Sacroiliac Flank", w:8, mult:"x2.0", note:"Bladder/lower intestines."},
        {f:"Left Flank (side abdomen)", b:"Left Lower Back Flank", w:5, mult:"x1.8", note:"Over kidney/lower ribs."},
        {f:"Right Flank (side abdomen)", b:"Right Lower Back Flank", w:5, mult:"x1.8", note:"Liver edge on right."},
        {f:"Front Pelvis / Hip (L+R)", b:"Sacrum / Rear Pelvis", w:6, mult:"x1.5", note:"Bony pelvis; mobility effects."},
        {f:"Groin / Genital Area", b:"Perineum / Rear Pelvic Floor", w:4, mult:"x2.5", note:"Small but highly vulnerable."},
        {f:"Umbilicus / Belly Button", b:"Coccyx / Tailbone", w:2, mult:"x1.2", note:"Small landmarks / superficial."}
      ],
      back: [] // same as front
    },

    arm: {
      title: "Arm",
      front: [
        {f:"Upper Arm (bicep)", b:"Rear Upper Arm (tricep)", w:14, mult:"x1.2", note:"Common melee/ranged hit zone."},
        {f:"Shoulder / Deltoid", b:"Rear Shoulder", w:10, mult:"x1.5", note:"Major joint; mobility loss."},
        {f:"Inner Arm (brachial artery)", b:"Outer Arm", w:8, mult:"x2.0", note:"Major artery risk."},
        {f:"Elbow (front crease)", b:"Elbow Point (olecranon)", w:8, mult:"x1.5", note:"Small joint; disabling pain."},
        {f:"Forearm (inner, flexors)", b:"Forearm (outer, extensors)", w:12, mult:"x1.0", note:"Moderate size/damage."},
        {f:"Wrist (inner)", b:"Wrist (outer)", w:6, mult:"x1.5", note:"Vulnerable joint; nerve-rich."},
        {f:"Palm / Fingers", b:"Back of Hand / Fingers", w:10, mult:"x1.5", note:"Fragile bones; precision damage."},
        {f:"Armpit", b:"Rear Axilla", w:8, mult:"x2.0", note:"Nerves and vessels."},
        {f:"Inner Elbow / Vein Channel", b:"Rear Mid Arm", w:6, mult:"x1.8", note:"Narrow but critical if pierced."},
        {f:"Outer Upper Arm", b:"Rear Shoulder Ridge", w:8, mult:"x1.0", note:"Large muscular surface."}
      ],
      back: [] // same as front
    },

    groin: {
      title: "Groin/Pelvis",
      front: [
        {f:"External Genitalia", b:"Perineum / Rear Pelvic Floor", w:20, mult:"x3.0", note:"Extremely painful; incapacitating."},
        {f:"Suprapubic / Pubic Symphysis", b:"Sacral Base / Lower Coccyx Junction", w:10, mult:"x2.0", note:"Bony midline; bladder risk."},
        {f:"Left Inguinal Fold", b:"Left Gluteal Crease / Upper Buttock", w:6, mult:"x2.5", note:"Femoral vessels/nerve nearby."},
        {f:"Right Inguinal Fold", b:"Right Gluteal Crease / Upper Buttock", w:6, mult:"x2.5", note:"Femoral vessels/nerve nearby."},
        {f:"Upper Inner Thigh (left)", b:"Upper Outer Thigh / Buttock (left)", w:4, mult:"x1.8", note:"Transition to leg; bleeding/limp."},
        {f:"Upper Inner Thigh (right)", b:"Upper Outer Thigh / Buttock (right)", w:4, mult:"x1.8", note:"Transition to leg; bleeding/limp."}
      ],
      back: [] // same as front
    },

    leg: {
      title: "Leg",
      front: [
        {f:"Upper Thigh (quadriceps)", b:"Rear Thigh (hamstrings)", w:14, mult:"x1.5", note:"Large muscle mass; common target."},
        {f:"Inner Thigh (adductors/femoral canal)", b:"Upper Outer Thigh / Buttock", w:8, mult:"x2.5", note:"Femoral vessels/nerve risk."},
        {f:"Knee (patella/front joint)", b:"Popliteal / Rear Knee", w:6, mult:"x2.0", note:"Joint; crippling if hit."},
        {f:"Shin (anterior tibia)", b:"Calf (gastrocnemius)", w:10, mult:"x1.4", note:"Bone strikes vs muscle."},
        {f:"Ankle (front/dorsum)", b:"Achilles / Heel", w:6, mult:"x2.5", note:"Severe mobility loss."},
        {f:"Foot (top/toes)", b:"Sole / Heel (plantar)", w:6, mult:"x1.8", note:"Small target; balance impact."}
      ],
      back: [] // same as front
    }
  };

  // Mirror any missing back arrays
  Object.keys(TABLES).forEach(k => {
    if (!TABLES[k].back || TABLES[k].back.length === 0) TABLES[k].back = TABLES[k].front.slice();
  });

  on("chat:message", (msg) => {
    if (msg.type !== "api") return;
    if (!/^!hit\b/i.test(msg.content)) return;

    const raw = msg.content;
    const facing = /front/i.test(raw) ? "front" : (/back/i.test(raw) ? "back" : null);
    const regionMatch = raw.match(/\b(head|upper|lower|arm|groin|leg)\b/i);
    const regionKey = regionMatch ? regionMatch[1].toLowerCase() : null;

    const attacker = getArg(raw, "attacker", "");
    const weapon   = getArg(raw, "weapon", "");

    if (!facing) {
      sendChat("Hit Location", "&{template:default} {{name=Choose Facing}} {{Use: !hit front}} {{or: !hit back}}");
      return;
    }

    const region = regionKey
      ? MAJOR.find(r => r.key === regionKey) || MAJOR[0]
      : pickWeighted(MAJOR);

    const table = TABLES[region.key][facing];
    const pick  = pickWeighted(table);

    // Randomly assign Left/Right for limbs
    let side = "";
    if (region.key === "arm" || region.key === "leg") {
      side = (randomInteger(2) === 1) ? "Left " : "Right ";
    }

    const who  = attacker ? "{{Attacker=" + attacker + "}}" : "";
    const weap = weapon   ? "{{Weapon=" + weapon   + "}}"   : "";

    const card =
      "&{template:default} " +
      "{{name=" + side + region.title + "}} " +
      who + weap +
      "{{Facing=" + (facing.charAt(0).toUpperCase() + facing.slice(1)) + "}} " +
      "{{Location=" + pick.f + "}} " +
      "{{Crit Dam=" + pick.mult + "}} " +
      "{{Note=" + pick.note + "}}";

    sendChat(msg.who || "GM", card);
  });
});
Initial commit of Roll20 Hit Location API script
