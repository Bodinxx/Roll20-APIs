# Roll20 Hit Location API

A Roll20 API script that generates realistic, weighted hit locations for tabletop RPGs.  
This script simulates strikes to different regions of the body, factoring in target size, rarity, and facing (front or back).  
It supports full descriptive outputs including critical multipliers, notes, and dynamic limb side selection (left/right).

---

## 🎯 Features

- **Weighted hit location system** based on realistic human anatomy  
- **Front / Back facing** distinction for attacks  
- **Dynamic Left / Right side labeling** for limbs (arms, legs)  
- **Optional attacker and weapon tags** for cinematic results  
- **Compact Roll20 chat card format** using the default template  
- **Single-facing display** (shows only the struck side)  
- **Public output only** — everyone sees the results  
- Fully compatible with **Roll20 Pro API sandbox**

---

## ⚙️ Installation

### 🧾 Requirements
- A **Roll20 Pro** subscription (the **API sandbox** is a Pro-only feature).  
  Free and Plus accounts cannot run custom API scripts.  
  → [Upgrade to Roll20 Pro](https://roll20.net/pro)

---

### 🔧 Step-by-Step Installation

1. **Log into Roll20** and open your game.  
2. From the **Game Settings** page, select **API Scripts** (available to Pro users only).  
3. Click **New Script**.  
4. Name it: **HitLocation.js**
5. Paste the full script into the editor window.  
6. Click **Save Script**.

✅ Once saved, the sandbox will restart automatically.  
You should see **“API ready”** in your Roll20 API log if it loaded correctly.

---

### 🧠 Optional Setup: Add a Macro

You can create a macro for easy access:

**Name:** `Hit Location`  
**Command:** !hit ?{Facing|Front|Back}

Then:
- Check “Show as Token Action”  
- Click the macro button during play to roll for hit location quickly.

---

## 🧩 Commands

| Command | Description |
|----------|--------------|
| `!hit front` | Rolls a hit location using front-facing tables |
| `!hit back` | Rolls a hit location using back-facing tables |
| `!hit front head` | Forces a roll within the specified region |
| `!hit front leg attacker:"Kane" weapon:"Shortsword"` | Includes attacker and weapon tags |

---

## 🧙‍♂️ Example Output

**Command:** !hit front leg attacker:"Kane" weapon:"Shortsword"
**Result:**
| Left Leg |
|-------------------|
| Attacker: Kane |
| Weapon: Shortsword |
| Facing: Front |
| Location: Upper Thigh (quadriceps) |
| Crit Dam: x1.5 |
| Note: Large muscle mass; common target. |

---

## 🧠 How It Works

The script:
- Selects a **major body region** (Head, Torso, Arms, Legs, etc.) based on weighted probability.  
- Determines which **facing** (front/back) is hit.  
- Randomly picks a detailed sub-location within that region.  
- Applies the correct **critical damage multiplier** and displays a short anatomical note.  
- If the hit is on a limb, automatically assigns **Left** or **Right**.

---

## 🧾 Notes

- You can edit the region weights and locations inside the script for custom races or monsters.  
- You can add new categories (e.g., “Tail,” “Wings,” “Tentacles”) following the existing data format.  
- Designed for use with **any d20-based TTRPG** (D&D, Pathfinder, custom systems, etc.).

---

## 📜 License

This project is released under the **MIT License**.  
You’re free to use, modify, and distribute this script provided proper credit is included.

For Roll20 usage, this script complies with the **Roll20 API Policy** and requires a **Roll20 Pro account** for sandbox execution.  
→ [Roll20 API Terms & Licensing Info](https://wiki.roll20.net/API:Script_Index)

---

## 💬 Credits

Created by **Ryan K.**  
Assisted and structured by *Jane*, AI collaborator.  
Special thanks to the Roll20 API developer community for documentation and support.
