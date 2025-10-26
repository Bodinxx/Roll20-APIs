# Roll20 Hit Location API

A Roll20 API script that generates realistic, weighted hit locations for tabletop RPGs.  
This script simulates strikes to different regions of the body, factoring in target size, rarity, and facing (front or back).  
It supports full descriptive outputs including critical multipliers, notes, and dynamic limb side selection (left/right).

---

## 🎯 Features

- **Weighted hit location system** based on realistic anatomy proportions  
- **Front / Back facing** distinction for attacks  
- **Dynamic Left / Right side labeling** for limbs (arms, legs)  
- **Optional attacker and weapon fields** for flavorful output  
- **Compact Roll20 chat card format** using the default template  
- **Single-facing display** (shows only the side that was struck)  
- Designed for **public output**, no whispering or GM-only messages  
- Fully compatible with **Roll20 Pro API sandbox**

---

## 🧩 Commands

| Command | Description |
|----------|--------------|
| `!hit front` | Rolls a hit location using front-facing tables |
| `!hit back` | Rolls a hit location using back-facing tables |
| `!hit front head` | Forces a roll only within the specified region |
| `!hit front leg attacker:"Kane" weapon:"Shortsword"` | Includes attacker and weapon tags in the display |

---

## 🧙‍♂️ Example Output

**Command:**  
!hit front leg attacker:"Kane" weapon:"Shortsword"

makefile
Copy code

**Result:**
- Left Leg
- Attacker: Kane
- Weapon: Shortsword
- Facing: Front
- Location: Upper Thigh (quadriceps)
- Crit Dam: x1.5
- Note: Large muscle mass; common target.

---

## ⚙️ Setup Instructions

1. Requires a **Roll20 Pro** account (API access).  
2. In your Roll20 game:
   - Go to **Game Settings → API Scripts → New Script**
   - Name it `HitLocation.js`
   - Paste the script contents
   - Save  
3. In Roll20 chat, use one of the `!hit` commands to test.

---

## 🎛️ Recommended Macro

To simplify calling the API, create a Roll20 macro:

**Name:** `Hit Location`  
**Command:**
!hit ?{Facing|Front|Back}

✅ This will prompt you to choose Front or Back each time you use it.

---

## 📘 Notes

- The script can easily be expanded with custom hit tables or non-humanoid targets.  
- If you modify weighting or add locations, just adjust the `w:` values in the data arrays.  
- Add more regions (e.g., Tail, Wings, Tentacles) following the same format.

---

## 📜 License

This project is released under the **MIT License**.  
You’re free to use, modify, and distribute it, provided proper credit is included.

---

## 💬 Credits

Created by **Ryan K.**  
Assisted and structured by *Jane*, your AI design collaborator.  
Special thanks to the Roll20 API developer community for their tools and documentation.
