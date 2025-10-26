# Area Saving Throw (AST)  
### Roll20 API Script

---

## Overview

The **Area Saving Throw** script automates group saving throws and damage resolution for area effects (such as fireballs, dragon breaths, traps, and spells) in Roll20.  
It allows a GM to quickly apply saves, resistances, immunities, and automatic hit point adjustments to multiple tokens — complete with chat feedback, damage rolls, and configuration options.

Originally authored and released under the MIT License, this version has been modernized for **Roll20’s JumpGate API sandbox** to ensure stability and compatibility with the current code environment.

---

## Features

- ✅ **Mass Saving Throws** — Apply saves to multiple selected tokens at once.  
- ✅ **Automatic HP Adjustment** — Tokens’ HP bars or linked character HP attributes are adjusted automatically.  
- ✅ **Resistance & Immunity Recognition** — Detects and applies damage reduction from character sheet attributes.  
- ✅ **Supports Advantage & Disadvantage** — Built-in advantage/disadvantage handling.  
- ✅ **Custom Damage & DC Inputs** — Flexible input for DC, damage dice, and success effects.  
- ✅ **Macro Auto-Creation** — Creates or updates GM/Player macros automatically.  
- ✅ **Visual Chat Output** — Uses colored feedback boxes for success/failure clarity.  
- ✅ **Re-roll & Revert Buttons** — Quickly re-roll or undo results directly from chat.  
- ✅ **Configuration Menu** — Change output and behavior settings in-game.  
- ✅ **JumpGate Safe** — Updated to use modern Roll20 inline roll handling (`[[ ]]`), preventing sandbox crashes.

---

## Installation

1. Open your Roll20 **Game Settings** → **API Scripts** tab.  
2. Click **New Script** and name it `AreaSavingThrow.js`.  
3. Paste in the full script from this repository (or your modified copy).  
4. Save the script — you should see “No errors” in the sandbox console.  
5. Once saved, the script automatically:
   - Runs internal startup checks  
   - Creates the `!ast` command macros (if missing)  
   - Makes all macros visible to all players  

---

## Usage

To execute a group area save: !ast [Attribute or Bonus] [Advantage?] [Save DC] [Effect on Success] [Damage Formula] [Damage Type]

**Example:**
!ast Dexterity Advantage 15 half 8d6 Fire

This rolls a **Dexterity saving throw** with **advantage**, DC **15**, dealing **8d6 Fire damage** (half on success).

### Custom Save (no ability score)
!ast 5 None 12 half 2d8+3 Lightning

Each selected token rolls with a flat +5 bonus.

---

## Additional Commands

| Command | Description |
|----------|--------------|
| `!ast help` | Lists all available commands and their syntax. |
| `!ast config` | Opens configuration menu in chat. |
| `!ast revert [tokenID] [damage]` | Reverts HP change for a token. |
| `!ast reroll [options...]` | Re-rolls the save (advantage/disadvantage). |
| `!ast Resistance [DamageType]` | Grants selected character resistance. |
| `!ast Immunity [DamageType]` | Grants selected character immunity. |
| `!ast Resistance None` | Removes all resistances. |
| `!ast Immunity None` | Removes all immunities. |

---

## Configuration Options

Run `!ast config` to open the configuration menu.  
Click a setting to adjust it directly in chat.

| Setting | Type | Default | Description |
|----------|------|----------|-------------|
| `individualRolls` | Boolean | `false` | Each target rolls its own damage. |
| `hpBar` | Number (1–3) | `3` | Which HP bar to use for unlinked tokens. |
| `notifyGM` | Boolean | `true` | Whisper results to the GM. |
| `notifyPlayer` | Boolean | `true` | Whisper results to controlling players. |
| `showDmgFormula` | Boolean | `true` | Displays the damage dice formula in chat. |
| `showDC` | Boolean | `true` | Shows the save DC in chat. |
| `showResistance` | Boolean | `true` | Shows when damage is reduced by resistance or negated by immunity. |

---

## Sheet Compatibility

- ✅ Works with **D&D 5e by Roll20** (2024 and 2014 versions).  
- ⚠️ Other sheets may need adjusted attribute names for resistances/immunities.

---

## Notes for JumpGate API Users

This version replaces the deprecated JSON parsing roller with a **safe inline-roll system**, ensuring compatibility with JumpGate’s stricter sandbox:

- Replaces  
  ```js
  JSON.parse(results[0].content).total

  WITH

  results[0].inlinerolls[0].results.total


- Adds automatic coercion for state values stored as strings (e.g., "true" → true).
- Protects against missing player objects and missing hp attributes.
- Fully backward-compatible with your existing macros and saved game state.

---

## Example Output
🧙‍♂️ *Goblin* attempted a *Dexterity* save, *DC 15* to half *[8d6] Fire* damage.
*Goblin failed* the save with a roll of *7 [d20 + 2 DEX]* and took *[[23]] Fire damage*.
- ✅ On success: shows half or no damage as configured.
- ✅ Automatically applies reductions for resistance or immunity.

---
## MIT License

Copyright © 2017–2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---
## Credits
- *Original Concept & Script*: Anonymous creator (MIT License, archived 2018)
- *Modernized & Maintained*: Ryan K. (2025 update for JumpGate sandbox)
- *Compatibility Support*: Roll20 API Developer Community
