/*
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// JumpGate-safe AreaSavingThrow
var AreaSavingThrow = AreaSavingThrow || (function () {
    'use strict';
    var stateName = 'AST',
        states = [
            ['individualRolls'],
            ['hpBar', [1, 2, 3], 3],
            ['notifyGM'],
            ['notifyPlayer'],
            ['showDmgFormula'],
            ['showDC'],
            ['showResistance']
        ],
        name = 'Area Save',
        nameError = name + ' ERROR',
        nameLog = name + ': ',

        // --- helpers ---
        coerce = function (v) {
            if (v === 'true') return true;
            if (v === 'false') return false;
            if (v === true || v === false) return v;
            if (v === '' || v === undefined || v === null) return v;
            return isFinite(v) ? Number(v) : v;
        },

        // JumpGate-safe roller: uses inline roll totals
        roll = function (formula) {
            return new Promise((resolve) => {
                sendChat('', `[[${formula}]]`, (ops) => {
                    try {
                        const total = ops?.[0]?.inlinerolls?.[0]?.results?.total;
                        if (typeof total === 'number') {
                            resolve(total);
                            return;
                        }
                        // very old fallback: try to sniff a total in content
                        const m = ops?.[0]?.content?.match?.(/"total":\s*([-\d.]+)/);
                        resolve(m ? Number(m[1]) : NaN);
                    } catch (e) {
                        resolve(NaN);
                    }
                });
            });
        },

        code = function (snippet) {
            return `<span style="background-color: rgba(0, 0, 0, 0.5); color: White; padding: 2px; border-radius: 3px;">${snippet}</span>`;
        },

        toChat = function (message, success, target) {
            let style = '<div>',
                whisper = target ? `/w ${target} ` : '';
            if (success === true) {
                style = `<br><div style="background-color: #5cd65c; color: Black; padding: 5px; border-radius: 10px;">`;
            } else if (success === false) {
                style = `<br><div style="background-color: #ff6666; color: Black; padding: 5px; border-radius: 10px;">`;
            }
            sendChat(name, `${whisper}${style}${message}</div>`);
        },

        toPlayer = function (message, success) {
            if (!success) {
                sendChat(name, `/w ${playerName} ` + message);
            } else {
                sendChat(name, `/w ${playerName} ` + '<br><div style="background-color: #5cd65c; color: Black; padding: 5px; border-radius: 10px;">' + message + '</div>');
            }
        },

        error = function (errMsg, codeNum) {
            if (playerName) {
                sendChat(nameError, `/w ${playerName} <br><div style="background-color: #ff6666; color: Black; padding: 5px; border-radius: 10px;">**${errMsg}** Error code ${codeNum}.</div>`);
            } else {
                sendChat(nameError, `<br><div style="background-color: #ff6666; color: Black; padding: 5px; border-radius: 10px;">**${errMsg}** Error code ${codeNum}.</div>`);
            }
            log(nameLog + errMsg + ` Error code ${codeNum}.`);
        },

        checkMacros = function () {
            let playerList = findObjs({ _type: 'player', _online: true }),
                gm = _.find(playerList, p => playerIsGM(p.id) === true),
                macrosArr = [
                    ['AreaSave',        '!ast ?{Saving throw attribute?|Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma} ?{Advantage?|None|Advantage|Disadvantage} ?{Save DC|12} ?{Effect on a success|Half Damage,half|No Damage,no|Full Damage,full} ?{Damage|1d8+3} ?{Damage Type|None,|Acid|Cold|Fire|Force|Lightning|Necrotic|Poison|Psychic|Radiant|Thunder}'],
                    ['AreaSaveCustom',  '!ast ?{Saving throw bonus?|5} ?{Advantage?|None|Advantage|Disadvantage} ?{Save DC|12} ?{Effect on a success|Half Damage,half|No Damage,no|Full Damage,full} ?{Damage|1d8+3} ?{Damage Type|None,|Acid|Cold|Fire|Force|Lightning|Necrotic|Poison|Psychic|Radiant|Thunder}'],
                    ['AreaSaveConfig',  '!ast config'],
                    ['AreaSaveHelp',    '!ast help'],
                    ['AddPCResistance', '!ast ?{Resistance or Immunity?|Resistance|Immunity} ?{Damage Type|None,|Acid|Cold|Fire|Force|Lightning|Necrotic|Poison|Psychic|Radiant|Thunder}']
                ];

            _.each(macrosArr, macro => {
                let macroObj = findObjs({ _type: 'macro', name: macro[0] })[0];
                if (macroObj) {
                    if (!String(macroObj.get('visibleto') || '').includes('all')) {
                        macroObj.set('visibleto', 'all');
                        toChat(`**Macro '${macro[0]}' was made visible to all.**`, true);
                    }
                    if (macroObj.get('action') !== macro[1]) {
                        macroObj.set('action', macro[1]);
                        toChat(`**Macro '${macro[0]}' was corrected.**`, true);
                    }
                } else if (gm && playerIsGM(gm.id)) {
                    createObj('macro', {
                        _playerid: gm.id,
                        name: macro[0],
                        action: macro[1],
                        visibleto: 'all'
                    });
                    toChat(`**Macro '${macro[0]}' was created and assigned to ${gm.get('_displayname')}.**`, true);
                }
            });
        },

        playerName,

        handleInput = function (msg) {
            if (msg.type === 'api' && msg.content.split(' ')[0] === '!ast') {
                playerName = (getObj('player', msg.playerid)?.get('_displayname') || 'Player').split(' ')[0];

                let parts = msg.content.split(' ');
                if (parts[1] === 'help') {
                    showHelp(msg);
                } else if (playerIsGM(msg.playerid)) {
                    if (parts[1] === 'config') {
                        if (!parts[2]) {
                            showConfig();
                        } else {
                            setConfig(msg);
                        }
                    } else if (parts[1] === 'revert') {
                        revert(msg);
                    } else if (parts[1] === 'reroll') {
                        reroll(msg);
                    } else if (msg.selected && msg.selected[0]) {
                        if (parts[1] === 'Resistance' || parts[1] === 'Immunity') {
                            addPCAttr(msg);
                        } else {
                            areaSavingThrow(msg);
                        }
                    } else {
                        error(`At least one token must be selected.`, 7);
                        return;
                    }
                } else {
                    error(`Sorry ${playerName}, but only GMs can access this api.`, 0);
                    return;
                }
            }
        },

        showHelp = function () {
            let commandsArr = [
                ['!ast help','Lists all commands, their parameters, and their usage.',`${code('!ast')} ${code('help')}`],
                ['!ast config','Shows the config, or if called with more variables, changes settings.',`${code('!ast')} ${code('config')} ${code('setting')} ${code('newValue')}`,['!ast config','It is recommended to use this command and change settings from the resultant menu.']],
                ['!ast resistance/immunity',`Adds resistance or immunity of the specified damage type to the selected token's Character.`,`${code('!ast')} ${code('resistance/immunity')} ${code('damageType')}`,['resistance/immunity',`Either ${code('resistance')} or ${code('immunity')}.`],['damageType',`The type of damage starting with a capital letter (eg. ${code('Fire')}).`]],
                ['!ast','Rolls the specified save for every selected token, adjusting health automatically.',`${code('!ast')} ${code('attribute/bonus')} ${code('advantage')} ${code('saveDC')} ${code('effectOnSuccess')} ${code('dmgFormula')} ${code('dmgType')}`,
                    ['attribute/bonus',`An Attribute like ${code('Wisdom')} or a number like ${code('5')}.`],
                    ['advantage',`${code('None')}, ${code('Advantage')}, or ${code('Disadvantage')}.`],
                    ['saveDC',`The DC to meet or exceed.`],
                    ['effectOnSuccess',`${code('Half Damage')}, ${code('No Damage')}, or ${code('Full Damage')}.`],
                    ['dmgFormula',`Like Roll20 ${code('/r')} uses (e.g., ${code('3d6+2')}).`],
                    ['dmgType',`Optional: checks resistance/immunity.`]
                ]
            ];
            _.each(commandsArr, command => {
                let output = `&{template:default} {{name=${code(command[0])} Help}}`;
                _.each(command, function (part, index) {
                    if (index < 3) {
                        const section = index === 0 ? 'Command' : index === 1 ? 'Function' : 'Typical Input';
                        output += `{{${section}=${part}}}`;
                    } else {
                        output += `{{${part[0]}=${part[1]}}}`;
                    }
                });
                toPlayer(output);
            });
            return;
        },

        showConfig = function () {
            let output = `&{template:default} {{name=Area Saving Throw Config}}`;
            _.each(states, value => {
                let acceptableValues = value[1] ? value[1] : [true, false],
                    defaultValue = value[2] ? value[2] : true,
                    currentValue = `${getState(value[0])}`,
                    stringVals = valuesToString(acceptableValues.slice(), defaultValue);
                output += `{{${value[0]}=[${currentValue}](!ast config ${value[0]} ?{New ${value[0]} value${stringVals}})}}`;
            });
            toPlayer(output);
            return;

            function valuesToString(values, defaultValue) {
                let output = '',
                    index = values.indexOf(defaultValue);
                if (index !== -1) {
                    let val = values.splice(index, 1);
                    values.unshift(val[0]);
                }
                _.each(values, value => { output += `|${value}`; });
                return output;
            }
        },

        setConfig = function (msg) {
            let parts = msg.content.split(' '),
                key = parts[2],
                newValRaw = parts.slice(3).join(' ').trim(), // handle values with spaces if any
                newVal = coerce(newValRaw);
            toPlayer(`**${key}** has been changed **from ${state[`${stateName}_${key}`]} to ${newVal}**.`, true);
            state[`${stateName}_${key}`] = newVal;
            showConfig();
            return;
        },

        areaSavingThrow = function (msg) {
            let parts = msg.content.split(' ');

            let attr = 'SET', saveBonus;
            if (Number.isFinite(parseInt(parts[1],10))) {
                saveBonus = parseInt(parts[1],10);
            } else {
                switch (parts[1]) {
                    case 'Strength':
                    case 'Dexterity':
                    case 'Constitution':
                    case 'Intelligence':
                    case 'Wisdom':
                    case 'Charisma':
                        attr = parts[1];
                        break;
                    default:
                        error(`Attribute or Bonus '${parts[1]}' not understood.`, 1);
                        return;
                }
            }

            let advantage;
            switch (parts[2]) {
                case 'None':         advantage = 'd20';        break;
                case 'Advantage':    advantage = '2d20kh1';    break;
                case 'Disadvantage': advantage = '2d20kl1';    break;
                default:
                    error(`Advantage '${parts[2]}' not understood.`, 2);
                    return;
            }

            let saveDC = parseInt(parts[3],10);
            if (!Number.isFinite(saveDC)) {
                error(`SaveDC '${parts[3]}' not understood.`, 3);
                return;
            }

            let successEffect;
            switch (parts[4]) {
                case 'half':
                case 'no':
                    successEffect = parts[4];
                    break;
                case 'full':
                    successEffect = 'none';
                    break;
                default:
                    error(`Effect on Success '${parts[4]}' not understood.`, 4);
                    return;
            }

            let dmgFormula;
            if (parts[5] && parts[5].search(/[^d+\d-]/g) !== -1) {
                error(`You entered damage as '${parts[5]}' and damage can only contain 'd, +, -' and integers.`, 5);
                return;
            } else {
                dmgFormula = parts[5] || '0';
            }

            let dmgType = parts[6] || 'None';

            let dmgTotal = 0;
            if (!getState('individualRolls')) {
                let p = roll(dmgFormula);
                dmgTotal = p;
                dmgTotal.then(dmg => {
                    if (isNaN(dmg)) {
                        error(`Damage formula '${dmgFormula}' was not understood.`, 6);
                        return;
                    }
                });
            }

            _.each(msg.selected, obj => {
                if (obj._type !== 'graphic') {
                    error(`A selected object was not a graphic.`, 10);
                    return;
                } else {
                    let token = getObj(obj._type, obj._id),
                        char = token.get('represents') ? getObj('character', token.get('represents')) : '',
                        isNPC = !char ? 1 : getAttrByName(char.id, 'npc') == 1 ? 1 : 0;

                    if (getState('individualRolls')) {
                        let p2 = roll(dmgFormula);
                        dmgTotal = p2;
                        dmgTotal.then(dmg => {
                            if (isNaN(dmg)) {
                                error(`Damage formula '${dmgFormula}' was not understood.`, 11);
                                return;
                            }
                        });
                    }

                    let resAttr = isNPC ? 'npc_resistances' : 'resistances',
                        resistances = (char && findObjs({ _type: 'attribute', _characterid: char.id, name: resAttr })[0]) ? (getAttrByName(char.id, resAttr) || '').toLowerCase() : '',
                        resistanceMod = 1,
                        immAttr = isNPC ? 'npc_immunities' : 'immunities',
                        immunities = (char && findObjs({ _type: 'attribute', _characterid: char.id, name: immAttr })[0]) ? (getAttrByName(char.id, immAttr) || '').toLowerCase() : '',
                        immune;
                    if (char && dmgType && dmgType !== 'None') {
                        if (immunities) { immune = immunities.includes(dmgType.toLowerCase()); }
                        if (resistances) { resistanceMod = resistances.includes(dmgType.toLowerCase()) ? 0.5 : 1; }
                    }

                    let saveAttr;
                    let localSaveBonus = saveBonus;
                    if (localSaveBonus === undefined) {
                        if (!char) {
                            error('Some selected tokens did not represent a sheet, and so have no save bonus.', 9);
                            localSaveBonus = 0;
                        } else if (isNPC) {
                            saveAttr = `npc_${attr.toLowerCase().slice(0, 3)}_save`;
                            localSaveBonus = parseInt(getAttrByName(char.id, saveAttr),10);
                            if (!Number.isFinite(localSaveBonus)) {
                                localSaveBonus = Math.floor((getAttrByName(char.id, attr.toLowerCase()) - 10) / 2);
                            }
                        } else {
                            saveAttr = attr.toLowerCase() + '_save_bonus';
                            localSaveBonus = parseInt(getAttrByName(char.id, saveAttr),10);
                            if (!Number.isFinite(localSaveBonus)) localSaveBonus = 0;
                        }
                    }

                    let result = roll(`${advantage}+${localSaveBonus}`),
                        successMod = 1,
                        success;
                    result.then(rtotal => {
                        success = rtotal >= saveDC ? true : false;
                        if (success) {
                            if (successEffect === 'half') {
                                successMod = 0.5;
                            } else if (successEffect === 'no') {
                                successMod = 0;
                            }
                        }
                    });

                    Promise.all([result, dmgTotal]).then(results => {
                        let tokenName = token.get('name') ? token.get('name') : 'Creature',
                            players = char?.get('controlledby') ? char.get('controlledby').split(',') : token.get('controlledby') ? token.get('controlledby').split(',') : [],
                            baseDmg = Number(results[1]) || 0,
                            dmgFinalRaw = immune ? 0 : baseDmg * successMod * resistanceMod,
                            dmgFinal = immune ? 0 : (Math.floor(dmgFinalRaw) < 1 ? 1 : Math.floor(dmgFinalRaw)),
                            chatDC = getState('showDC') ? `DC ${saveDC} ` : ``,
                            chatAdv = parts[2] !== 'None' ? `with ${parts[2]} ` : ``,
                            chatSucEffect = successEffect === 'half' ? 'to half' : successEffect === 'no' ? 'to nullify' : 'against',
                            chatDmgFormula = getState('showDmgFormula') ? ` [${dmgFormula}]` : ``,
                            chatDmgType = dmgType !== 'None' ? ` ${dmgType}` : '',
                            chatSuccess = successMod !== 1 ? `succeeded` : `failed`,
                            saveResultFormula = ` [${advantage} + ${localSaveBonus} ${attr.toUpperCase().slice(0, 3)}]`,
                            chatSaveResult = `${results[0]}${saveResultFormula}`,
                            chatResistance = getState('showResistance') ? (immune ? ` but was **Immune to ${dmgType}**` : (resistanceMod !== 1 ? ` and had **Resistance to ${dmgType}**` : ``)) : ``,
                            hpAdjSuccess = successMod !== 1 ? ` x ${successMod} SUCCESS` : '',
                            hpAdjResistance = getState('showResistance') ? (resistanceMod !== 1 ? ` x ${resistanceMod} RESIST` : '') : '',
                            hpAdjImmune = getState('showResistance') ? (immune ? ` x 0 IMMUNE` : '') : '',
                            chatHpAdjusted = immune ? `no` : (getState('showDmgFormula') ? `[[${dmgFinal} [${baseDmg}${hpAdjSuccess}${hpAdjResistance}${hpAdjImmune}] +d0]]` : `[[${dmgFinal}]]`),
                            colorSuccess = success ? true : (immune ? true : false),
                            target = !char ? token : isNPC ? token : char;

                        dealDamage(target, dmgFinal);

                        _.map(players, id => {
                            let controllerName = getObj('player', id)?.get('_displayname') || '';
                            let shortName = controllerName ? controllerName.split(' ', 1)[0] : '';
                            return shortName;
                        });

                        if (getState('notifyPlayer')) {
                            if (getState('notifyGM')) {
                                players.unshift('gm');
                            }
                            _.each(players, controllerName => {
                                if (controllerName) toChat(buildOutput(), colorSuccess, controllerName);
                            });
                        } else if (getState('notifyGM')) {
                            toChat(buildOutput(), colorSuccess, 'gm');
                        }
                        return;

                        function buildOutput() {
                            let output = `**${tokenName}** attempted a **${chatDC}${attr}** save, ${chatAdv}**${chatSucEffect} [[${baseDmg}${chatDmgFormula} +d0]]${chatDmgType}** damage.<br>**${tokenName} ${chatSuccess}** the save with a roll of [[${chatSaveResult} +d0]]${chatResistance}, so **lost ${chatHpAdjusted} hit points.**<br><div style="text-align: center">[REVERT](!ast revert ${token.id} ${baseDmg}) [REROLL](!ast reroll ?{Keep the better or worse of the two rolls|Better &#40;Should have had Advantage&#41;,Advantage|Worse &#40;Should have had Disadvantage&#41;,Disadvantage} ${localSaveBonus} ${token.id} ${baseDmg} ${saveDC} ${successEffect} ${success ? 'true' : ''} ${dmgType})</div>`;
                            return output;
                        }
                    });
                }
            });
        },

        // Adjust HP on character or token; creates attribute if missing
        adjust = function (attrName, targetID, adjustment, isChar, targetName) {
            if (isChar) {
                let attr = findObjs({ _type: 'attribute', _characterid: targetID, name: attrName })[0];
                if (!attr) {
                    // Create attribute if it doesn't exist; default to max or 0
                    let maxValueNew = getAttrByName(targetID, attrName, 'max');
                    attr = createObj('attribute', {
                        _characterid: targetID,
                        name: attrName,
                        current: Number.isFinite(+maxValueNew) ? +maxValueNew : 0,
                        max: Number.isFinite(+maxValueNew) ? +maxValueNew : ''
                    });
                }
                let currentValue = getAttrByName(targetID, attrName),
                    maxValue = getAttrByName(targetID, attrName, 'max'),
                    base = Number.isFinite(+currentValue) ? +currentValue : (Number.isFinite(+maxValue) ? +maxValue : 0),
                    newValue = base + +adjustment;

                attr.setWithWorker({ current: newValue });
                if (targetName) { toChat(`**Character ${targetName}'s ${attrName} set to ${newValue}.**`, true, playerName); }
                return newValue;
            } else {
                let token = getObj('graphic', targetID),
                    bar = `bar${getState('hpBar')}`,
                    currentValue = token.get(`${bar}_value`),
                    maxValue = token.get(`${bar}_max`),
                    base = Number.isFinite(+currentValue) ? +currentValue : (Number.isFinite(+maxValue) ? +maxValue : 0),
                    newValue = base + +adjustment;

                token.set(`${bar}_value`, newValue);
                if (targetName) { toChat(`**Token ${targetName}'s ${attrName} bar set to ${newValue}.**`, true, playerName); }
                return newValue;
            }
        },

        dealDamage = function (target, dmg) {
            if (target.get('_type') === 'character') {
                adjust('hp', target.id, -dmg, true);
            } else {
                adjust('hp', target.id, -dmg, false);
            }
        },

        revert = function (msg) {
            let parts = msg.content.split(' '),
                token = getObj('graphic', parts[2]),
                dmg = Number(parts[3]) || 0,
                charid = token.get('represents'),
                char = charid ? getObj('character', charid) : '',
                isNPC = !char ? true : getAttrByName(charid, 'npc') == 1 ? true : false;

            if (!isNPC) {
                let hp = adjust('hp', charid, dmg, true);
                toChat(`**Character ${token.get('name')}'s hp reverted to ${hp}.**`, true);
            } else {
                let hp = adjust('hp', token.id, dmg, false);
                toChat(`**Token ${token.get('name')}'s bar${getState('hpBar')} reverted to ${hp}.**`, true);
            }
            return;
        },

        reroll = function (msg) {
            let parts = msg.content.split(' '),
                adv = parts[2],
                bonus = Number(parts[3]) || 0,
                tokenID = parts[4],
                dmg = Number(parts[5]) || 0,
                dc = Number(parts[6]) || 0,
                successEffect = parts[7],
                oldSuccess = !!parts[8],
                dmgType = parts[9];

            let token = getObj('graphic', tokenID),
                tokenName = token.get('name'),
                charID = token.get('represents'),
                isNPC = !charID || !getObj('character', charID) ? true : getAttrByName(charID, 'npc') == 1 ? true : false,
                ID = !isNPC ? charID : tokenID;

            let successMod = successEffect === 'half' ? 0.5 : successEffect === 'no' ? 1 : 0,
                adjustedDmg = dmg * successMod,
                finalDmg = adv === 'Disadvantage' ? Math.ceil(adjustedDmg) : Math.floor(adjustedDmg);

            let chatDC = getState('showDC') ? ` DC ${dc}` : ``,
                chatSucEffect = successEffect === 'half' ? 'to half' : successEffect === 'no' ? 'to nullify' : 'against',
                chatDmgType = dmgType !== 'None' ? ` ${dmgType}` : '',
                chatDmgApply = '';

            let rollResult = roll(`d20+${bonus}`), newHP;
            rollResult.then(result => {
                let success = result >= dc ? true : false,
                    chatSuccess = success ? `succeeded` : `failed`;

                if (successEffect !== 0) {
                    if (oldSuccess) {
                        if (adv === 'Disadvantage' && result < dc) {
                            newHP = adjust('hp', ID, -finalDmg, !isNPC);
                            if (successEffect !== 'full') {
                                let chatDifference = 'more',
                                    chatHpAdjusted = `[[${finalDmg}]] ${chatDifference}`;
                                chatDmgApply = ` and, so **lost ${chatHpAdjusted} hit points`;
                            }
                        }
                    } else {
                        if (adv === 'Advantage' && result >= dc) {
                            newHP = adjust('hp', ID, +finalDmg, !isNPC);
                            if (successEffect !== 'full') {
                                let chatDifference = 'less',
                                    chatHpAdjusted = `[[${finalDmg}]] ${chatDifference}`;
                                chatDmgApply = ` and, so **lost ${chatHpAdjusted} hit points`;
                            }
                        }
                    }
                }

                toChat(`**${tokenName}** re-rolled the**${chatDC}** saving throw as their **${adv}, ${chatSucEffect} [[${dmg}]]${chatDmgType}** damage.<br>**${tokenName} ${chatSuccess}** the re-roll with a result of [[${result} [d20+${bonus}] +d0]]${chatDmgApply}.**`, success, playerName);
                return;
            });
        },

        addPCAttr = function (msg) {
            let parts = msg.content.split(' '),
                dmgTypes = ['Acid', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic', 'Poison', 'Psychic', 'Radiant', 'Thunder'],
                resTypes = ['Resistance', 'Immunity'];

            if (resTypes.includes(parts[1]) && (dmgTypes.includes(parts[2]) || parts[2] === 'None')) {
                _.each(msg.selected, obj => {
                    let token = getObj(obj._type, obj._id),
                        tokenName = token.get('name'),
                        charid = token.get('represents'),
                        char = charid ? getObj('character', charid) : '',
                        attrName = parts[1] === 'Resistance' ? 'resistances' : 'immunities';

                    if (char) {
                        let attr = findObjs({ _type: 'attribute', _characterid: charid, name: attrName })[0];
                        if (parts[2] === 'None') {
                            if (attr) {
                                attr.remove();
                                toChat(`**Removed all ${parts[1] === 'Resistance' ? 'Resistances' : 'Immunities'} from ${tokenName}.**`, true);
                            } else {
                                error(`Could not find any ${parts[1] === 'Resistance' ? 'Resistances' : 'Immunities'} for '${token}'.`, 16);
                                return;
                            }
                        } else {
                            if (attr) {
                                attr.setWithWorker({ current: (getAttrByName(charid, attrName) || '') + `, ${parts[2]}` });
                                toChat(`**Granted ${tokenName} ${parts[1]} to ${parts[2]}.**`, true);
                            } else {
                                createObj('attribute', { _characterid: charid, name: attrName, current: parts[2] });
                                toChat(`**Granted ${tokenName} ${parts[1]} to ${parts[2]}.**`, true);
                            }
                            return;
                        }
                    } else {
                        error(`Could not find a character sheet for token '${token}'. Are you sure the token represents a sheet?`, 13);
                        return;
                    }
                });
            } else if (!resTypes.includes(parts[1])) {
                error(`This API can only grant characters 'resistance' or 'immunity'. You entered '${parts[1]}'.`, 14);
                return;
            } else {
                error(`Could not add ${parts[1]} to '${parts[2]}' because no such damage type exists.`, 12);
                return;
            }
        },

        getState = function (value) {
            return state[`${stateName}_${value}`];
        },

        startupChecks = function () {
            _.each(states, variable => {
                let values = variable[1] ? variable[1] : [true, false],
                    defaultValue = variable[2] ? variable[2] : true,
                    current = state[`${stateName}_${variable[0]}`];

                // coerce persisted strings back to proper types
                let normalized = (current === undefined) ? undefined : coerce(current);
                if (normalized !== undefined) {
                    state[`${stateName}_${variable[0]}`] = normalized;
                }

                if (state[`${stateName}_${variable[0]}`] === undefined || !values.includes(state[`${stateName}_${variable[0]}`])) {
                    error(`**'${variable[0]}'** value **was '${state[`${stateName}_${variable[0]}`]}'** but has now been **set to its default** value, '${defaultValue}'.`, -1);
                    state[`${stateName}_${variable[0]}`] = defaultValue;
                }
            });
        },

        registerEventHandlers = function () {
            on('chat:message', handleInput);
        };

    return {
        StartupChecks: startupChecks,
        RegisterEventHandlers: registerEventHandlers,
        CheckMacros: checkMacros
    };
}());

on('ready', function () {
    'use strict';
    AreaSavingThrow.StartupChecks();
    AreaSavingThrow.RegisterEventHandlers();
    AreaSavingThrow.CheckMacros();
});