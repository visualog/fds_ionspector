# DESIGN.md - Agent_skill_test

## Overview
Agent_skill_test is a local FDS-derived design system source used to preserve original token names and hierarchy for downstream design generation. The naming model intentionally keeps the original slash-based FDS token structure so tools like Stitch can reference the same vocabulary used in Figma.

This export was generated from the local variable catalog inside the `Agent_skill_test` Figma file through xbridge. Color token names were read successfully, but full-file raw color values were not exposed by the current local-file search endpoint. Because of that limitation, color sections below preserve the original names, hierarchy, and intended usage while leaving color values unresolved.

## Token Rules
- Preserve original FDS token names exactly.
- Preserve original slash-based hierarchy exactly.
- Prefer semantic tokens such as `Color/bg/*`, `Color/text/*`, `Color/border/*`, and `Color/icon/*` before raw palette tokens.
- Use component-scoped families such as `Color/avatar/*` directly when designing avatars, club badges, or similar identity elements.
- Use raw palette tokens only when semantic tokens are unavailable.

## Colors

### Semantic Colors
#### Background
| Token | Value | Usage |
| --- | --- | --- |
| `Color/bg/brand` | `n/a` | Semantic background or surface |
| `Color/bg/error` | `n/a` | Semantic background or surface |
| `Color/bg/error_disabled` | `n/a` | Semantic background or surface |
| `Color/bg/interactive/brand` | `n/a` | Interactive background state |
| `Color/bg/interactive/brand-disabled` | `n/a` | Interactive background state |
| `Color/bg/interactive/brand-hover` | `n/a` | Interactive background state |

#### Text
| Token | Value | Usage |
| --- | --- | --- |
| `Color/text/brand` | `n/a` | Semantic text color |
| `Color/text/disabled` | `n/a` | Semantic text color |
| `Color/text/error` | `n/a` | Semantic text color |
| `Color/text/error-light` | `n/a` | Semantic text color |
| `Color/text/info` | `n/a` | Semantic text color |
| `Color/text/interactive/brand` | `n/a` | Interactive text state |
| `Color/text/interactive/brand-disabled` | `n/a` | Interactive text state |
| `Color/text/interactive/brand-hover` | `n/a` | Interactive text state |
| `Color/text/interactive/error` | `n/a` | Interactive text state |
| `Color/text/interactive/error-disabled` | `n/a` | Interactive text state |
| `Color/text/interactive/inverse` | `n/a` | Interactive text state |
| `Color/text/interactive/primary` | `n/a` | Interactive text state |
| `Color/text/interactive/primary-disabled` | `n/a` | Interactive text state |
| `Color/text/inverse` | `n/a` | Semantic text color |
| `Color/text/loading` | `n/a` | Semantic text color |
| `Color/text/primary` | `n/a` | Semantic text color |
| `Color/text/secondary` | `n/a` | Semantic text color |
| `Color/text/success` | `n/a` | Semantic text color |
| `Color/text/success-light` | `n/a` | Semantic text color |

#### Border
| Token | Value | Usage |
| --- | --- | --- |
| `Color/border/info` | `n/a` | Semantic border and divider |
| `Color/border/interactive/card` | `n/a` | Interactive border state |
| `Color/border/interactive/error` | `n/a` | Interactive border state |
| `Color/border/interactive/input` | `n/a` | Interactive border state |
| `Color/border/interactive/input-hover` | `n/a` | Interactive border state |
| `Color/border/interactive/popup` | `n/a` | Interactive border state |
| `Color/border/interactive/selected` | `n/a` | Interactive border state |
| `Color/border/inverse` | `n/a` | Semantic border and divider |
| `Color/border/primary` | `n/a` | Semantic border and divider |
| `Color/border/secondary` | `n/a` | Semantic border and divider |
| `Color/border/tertiary` | `n/a` | Semantic border and divider |

#### Icon
| Token | Value | Usage |
| --- | --- | --- |
| `Color/icon/brand` | `n/a` | Semantic icon color |
| `Color/icon/error` | `n/a` | Semantic icon color |
| `Color/icon/info` | `n/a` | Semantic icon color |
| `Color/icon/interactive/brand` | `n/a` | Interactive icon state |
| `Color/icon/interactive/brand-disabled` | `n/a` | Interactive icon state |
| `Color/icon/interactive/brand-hovered` | `n/a` | Interactive icon state |
| `Color/icon/interactive/error` | `n/a` | Interactive icon state |
| `Color/icon/interactive/inverse` | `n/a` | Interactive icon state |
| `Color/icon/interactive/primary` | `n/a` | Interactive icon state |
| `Color/icon/interactive/primary-disabled` | `n/a` | Interactive icon state |
| `Color/icon/interactive/secondary` | `n/a` | Interactive icon state |
| `Color/icon/interactive/secondary-disabled` | `n/a` | Interactive icon state |
| `Color/icon/interactive/selected` | `n/a` | Interactive icon state |
| `Color/icon/interactive/tertiary` | `n/a` | Interactive icon state |
| `Color/icon/inverse` | `n/a` | Semantic icon color |
| `Color/icon/loading` | `n/a` | Semantic icon color |
| `Color/icon/primary` | `n/a` | Semantic icon color |
| `Color/icon/success` | `n/a` | Semantic icon color |

#### Avatar
| Token | Value | Usage |
| --- | --- | --- |
| `Color/avatar/cool gray/bg` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/cool gray/bg-bold` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/cool gray/border` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/cool gray/border-black` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/cool gray/icon` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/cool gray/icon-inverse` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/cool gray/text` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/cool gray/text-inverse` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/inverse` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/orange/bg` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/red/bg` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/red/bg-bold` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/red/border` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/red/border-black` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/red/icon` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/red/icon-inverse` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/red/text` | `n/a` | Avatar or club badge semantic token |
| `Color/avatar/red/text-inverse` | `n/a` | Avatar or club badge semantic token |

### Raw Palette

#### Avatar
| Token | Value | Usage |
| --- | --- | --- |
| `color/avatar/20` | `n/a` | Avatar raw palette token |
| `color/avatar/30` | `n/a` | Avatar raw palette token |
| `color/avatar/40` | `n/a` | Avatar raw palette token |
| `color/avatar/50` | `n/a` | Avatar raw palette token |
| `color/avatar/60` | `n/a` | Avatar raw palette token |
| `color/avatar/70` | `n/a` | Avatar raw palette token |
| `color/avatar/80` | `n/a` | Avatar raw palette token |
| `color/avatar/90` | `n/a` | Avatar raw palette token |
| `color/avatar/100` | `n/a` | Avatar raw palette token |
| `color/avatar/Black alpha/10` | `n/a` | Avatar raw palette token |
| `color/avatar/cool gray/20` | `n/a` | Avatar raw palette token |
| `color/avatar/cool gray/30` | `n/a` | Avatar raw palette token |
| `color/avatar/cool gray/50` | `n/a` | Avatar raw palette token |
| `color/avatar/cool gray/70` | `n/a` | Avatar raw palette token |
| `color/avatar/cool gray/90` | `n/a` | Avatar raw palette token |
| `color/avatar/cool gray/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/cyan/20` | `n/a` | Avatar raw palette token |
| `color/avatar/cyan/30` | `n/a` | Avatar raw palette token |
| `color/avatar/cyan/50` | `n/a` | Avatar raw palette token |
| `color/avatar/cyan/70` | `n/a` | Avatar raw palette token |
| `color/avatar/cyan/90` | `n/a` | Avatar raw palette token |
| `color/avatar/cyan/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/deep blue/20` | `n/a` | Avatar raw palette token |
| `color/avatar/deep blue/30` | `n/a` | Avatar raw palette token |
| `color/avatar/deep blue/50` | `n/a` | Avatar raw palette token |
| `color/avatar/deep blue/70` | `n/a` | Avatar raw palette token |
| `color/avatar/deep blue/90` | `n/a` | Avatar raw palette token |
| `color/avatar/deep blue/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/deep green/20` | `n/a` | Avatar raw palette token |
| `color/avatar/deep green/30` | `n/a` | Avatar raw palette token |
| `color/avatar/deep green/50` | `n/a` | Avatar raw palette token |
| `color/avatar/deep green/70` | `n/a` | Avatar raw palette token |
| `color/avatar/deep green/90` | `n/a` | Avatar raw palette token |
| `color/avatar/deep green/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/green/20` | `n/a` | Avatar raw palette token |
| `color/avatar/green/30` | `n/a` | Avatar raw palette token |
| `color/avatar/green/50` | `n/a` | Avatar raw palette token |
| `color/avatar/green/60` | `n/a` | Avatar raw palette token |
| `color/avatar/green/80` | `n/a` | Avatar raw palette token |
| `color/avatar/green/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/light blue/20` | `n/a` | Avatar raw palette token |
| `color/avatar/light blue/30` | `n/a` | Avatar raw palette token |
| `color/avatar/light blue/50` | `n/a` | Avatar raw palette token |
| `color/avatar/light blue/70` | `n/a` | Avatar raw palette token |
| `color/avatar/light blue/90` | `n/a` | Avatar raw palette token |
| `color/avatar/light blue/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/orange/20` | `n/a` | Avatar raw palette token |
| `color/avatar/orange/30` | `n/a` | Avatar raw palette token |
| `color/avatar/orange/50` | `n/a` | Avatar raw palette token |
| `color/avatar/orange/60` | `n/a` | Avatar raw palette token |
| `color/avatar/orange/80` | `n/a` | Avatar raw palette token |
| `color/avatar/orange/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/pink/20` | `n/a` | Avatar raw palette token |
| `color/avatar/pink/30` | `n/a` | Avatar raw palette token |
| `color/avatar/pink/50` | `n/a` | Avatar raw palette token |
| `color/avatar/pink/70` | `n/a` | Avatar raw palette token |
| `color/avatar/pink/90` | `n/a` | Avatar raw palette token |
| `color/avatar/pink/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/purple/20` | `n/a` | Avatar raw palette token |
| `color/avatar/purple/30` | `n/a` | Avatar raw palette token |
| `color/avatar/purple/50` | `n/a` | Avatar raw palette token |
| `color/avatar/purple/70` | `n/a` | Avatar raw palette token |
| `color/avatar/purple/90` | `n/a` | Avatar raw palette token |
| `color/avatar/purple/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/red/20` | `n/a` | Avatar raw palette token |
| `color/avatar/red/30` | `n/a` | Avatar raw palette token |
| `color/avatar/red/50` | `n/a` | Avatar raw palette token |
| `color/avatar/red/60` | `n/a` | Avatar raw palette token |
| `color/avatar/red/80` | `n/a` | Avatar raw palette token |
| `color/avatar/red/alpha` | `n/a` | Avatar raw palette token |
| `color/avatar/yellow orange/20` | `n/a` | Avatar raw palette token |
| `color/avatar/yellow orange/30` | `n/a` | Avatar raw palette token |
| `color/avatar/yellow orange/50` | `n/a` | Avatar raw palette token |
| `color/avatar/yellow orange/70` | `n/a` | Avatar raw palette token |
| `color/avatar/yellow orange/90` | `n/a` | Avatar raw palette token |
| `color/avatar/yellow orange/alpha` | `n/a` | Avatar raw palette token |

#### Light / Black Alpha
| Token | Value | Usage |
| --- | --- | --- |
| `light/Black alpha/10` | `n/a` | Light theme raw palette token |
| `light/Black alpha/20` | `n/a` | Light theme raw palette token |
| `light/Black alpha/30` | `n/a` | Light theme raw palette token |
| `light/Black alpha/40` | `n/a` | Light theme raw palette token |
| `light/Black alpha/50` | `n/a` | Light theme raw palette token |
| `light/Black alpha/60` | `n/a` | Light theme raw palette token |
| `light/Black alpha/70` | `n/a` | Light theme raw palette token |
| `light/Black alpha/80` | `n/a` | Light theme raw palette token |
| `light/Black alpha/90` | `n/a` | Light theme raw palette token |

#### Light / Blue
| Token | Value | Usage |
| --- | --- | --- |
| `light/Blue/10` | `n/a` | Light theme raw palette token |
| `light/Blue/20` | `n/a` | Light theme raw palette token |
| `light/Blue/30` | `n/a` | Light theme raw palette token |
| `light/Blue/40` | `n/a` | Light theme raw palette token |
| `light/Blue/50` | `n/a` | Light theme raw palette token |
| `light/Blue/60` | `n/a` | Light theme raw palette token |
| `light/Blue/70` | `n/a` | Light theme raw palette token |
| `light/Blue/80` | `n/a` | Light theme raw palette token |
| `light/Blue/90` | `n/a` | Light theme raw palette token |
| `light/Blue/100` | `n/a` | Light theme raw palette token |

#### Light / CoolGray
| Token | Value | Usage |
| --- | --- | --- |
| `light/CoolGray/20` | `n/a` | Light theme raw palette token |
| `light/CoolGray/30` | `n/a` | Light theme raw palette token |
| `light/CoolGray/50` | `n/a` | Light theme raw palette token |
| `light/CoolGray/70` | `n/a` | Light theme raw palette token |
| `light/CoolGray/90` | `n/a` | Light theme raw palette token |
| `light/CoolGray/alpha` | `n/a` | Light theme raw palette token |

#### Light / Cyan
| Token | Value | Usage |
| --- | --- | --- |
| `light/Cyan/20` | `n/a` | Light theme raw palette token |
| `light/Cyan/30` | `n/a` | Light theme raw palette token |
| `light/Cyan/50` | `n/a` | Light theme raw palette token |
| `light/Cyan/70` | `n/a` | Light theme raw palette token |
| `light/Cyan/90` | `n/a` | Light theme raw palette token |
| `light/Cyan/alpha` | `n/a` | Light theme raw palette token |

#### Light / DeepBlue
| Token | Value | Usage |
| --- | --- | --- |
| `light/DeepBlue/20` | `n/a` | Light theme raw palette token |
| `light/DeepBlue/30` | `n/a` | Light theme raw palette token |
| `light/DeepBlue/50` | `n/a` | Light theme raw palette token |
| `light/DeepBlue/70` | `n/a` | Light theme raw palette token |
| `light/DeepBlue/90` | `n/a` | Light theme raw palette token |
| `light/DeepBlue/alpha` | `n/a` | Light theme raw palette token |

#### Light / DeepGreen
| Token | Value | Usage |
| --- | --- | --- |
| `light/DeepGreen/20` | `n/a` | Light theme raw palette token |
| `light/DeepGreen/30` | `n/a` | Light theme raw palette token |
| `light/DeepGreen/50` | `n/a` | Light theme raw palette token |
| `light/DeepGreen/70` | `n/a` | Light theme raw palette token |
| `light/DeepGreen/90` | `n/a` | Light theme raw palette token |
| `light/DeepGreen/alpha` | `n/a` | Light theme raw palette token |

#### Light / Gray
| Token | Value | Usage |
| --- | --- | --- |
| `light/Gray/10` | `n/a` | Light theme raw palette token |
| `light/Gray/20` | `n/a` | Light theme raw palette token |
| `light/Gray/30` | `n/a` | Light theme raw palette token |
| `light/Gray/40` | `n/a` | Light theme raw palette token |
| `light/Gray/50` | `n/a` | Light theme raw palette token |
| `light/Gray/60` | `n/a` | Light theme raw palette token |
| `light/Gray/70` | `n/a` | Light theme raw palette token |
| `light/Gray/80` | `n/a` | Light theme raw palette token |
| `light/Gray/90` | `n/a` | Light theme raw palette token |
| `light/Gray/100` | `n/a` | Light theme raw palette token |
| `light/Gray/white` | `n/a` | Light theme raw palette token |

#### Light / Green
| Token | Value | Usage |
| --- | --- | --- |
| `light/Green/10` | `n/a` | Light theme raw palette token |
| `light/Green/20` | `n/a` | Light theme raw palette token |
| `light/Green/30` | `n/a` | Light theme raw palette token |
| `light/Green/40` | `n/a` | Light theme raw palette token |
| `light/Green/50` | `n/a` | Light theme raw palette token |
| `light/Green/60` | `n/a` | Light theme raw palette token |
| `light/Green/70` | `n/a` | Light theme raw palette token |
| `light/Green/80` | `n/a` | Light theme raw palette token |
| `light/Green/90` | `n/a` | Light theme raw palette token |
| `light/Green/100` | `n/a` | Light theme raw palette token |
| `light/Green/alpha` | `n/a` | Light theme raw palette token |

#### Light / LightBlue
| Token | Value | Usage |
| --- | --- | --- |
| `light/LightBlue/20` | `n/a` | Light theme raw palette token |
| `light/LightBlue/30` | `n/a` | Light theme raw palette token |
| `light/LightBlue/50` | `n/a` | Light theme raw palette token |
| `light/LightBlue/60` | `n/a` | Light theme raw palette token |
| `light/LightBlue/70` | `n/a` | Light theme raw palette token |
| `light/LightBlue/90` | `n/a` | Light theme raw palette token |
| `light/LightBlue/alpha` | `n/a` | Light theme raw palette token |

#### Light / Orange
| Token | Value | Usage |
| --- | --- | --- |
| `light/Orange/20` | `n/a` | Light theme raw palette token |
| `light/Orange/30` | `n/a` | Light theme raw palette token |
| `light/Orange/50` | `n/a` | Light theme raw palette token |
| `light/Orange/60` | `n/a` | Light theme raw palette token |
| `light/Orange/80` | `n/a` | Light theme raw palette token |
| `light/Orange/alpha` | `n/a` | Light theme raw palette token |

#### Light / Pink
| Token | Value | Usage |
| --- | --- | --- |
| `light/Pink/20` | `n/a` | Light theme raw palette token |
| `light/Pink/30` | `n/a` | Light theme raw palette token |
| `light/Pink/50` | `n/a` | Light theme raw palette token |
| `light/Pink/70` | `n/a` | Light theme raw palette token |
| `light/Pink/90` | `n/a` | Light theme raw palette token |
| `light/Pink/alpha` | `n/a` | Light theme raw palette token |

#### Light / Purple
| Token | Value | Usage |
| --- | --- | --- |
| `light/Purple/20` | `n/a` | Light theme raw palette token |
| `light/Purple/30` | `n/a` | Light theme raw palette token |
| `light/Purple/50` | `n/a` | Light theme raw palette token |
| `light/Purple/70` | `n/a` | Light theme raw palette token |
| `light/Purple/90` | `n/a` | Light theme raw palette token |
| `light/Purple/alpha` | `n/a` | Light theme raw palette token |

#### Light / Red
| Token | Value | Usage |
| --- | --- | --- |
| `light/Red/20` | `n/a` | Light theme raw palette token |
| `light/Red/30` | `n/a` | Light theme raw palette token |
| `light/Red/50` | `n/a` | Light theme raw palette token |
| `light/Red/60` | `n/a` | Light theme raw palette token |
| `light/Red/80` | `n/a` | Light theme raw palette token |
| `light/Red/alpha` | `n/a` | Light theme raw palette token |

#### Light / YellowOrange
| Token | Value | Usage |
| --- | --- | --- |
| `light/YellowOrange/20` | `n/a` | Light theme raw palette token |
| `light/YellowOrange/30` | `n/a` | Light theme raw palette token |
| `light/YellowOrange/50` | `n/a` | Light theme raw palette token |
| `light/YellowOrange/70` | `n/a` | Light theme raw palette token |

## Spacing

| Token | Value | Usage |
| --- | --- | --- |
| `spacing/0` | `0px` | Spacing scale token |
| `spacing/2` | `2px` | Spacing scale token |
| `spacing/4` | `4px` | Spacing scale token |
| `spacing/6` | `6px` | Spacing scale token |
| `spacing/8` | `8px` | Spacing scale token |
| `spacing/10` | `10px` | Spacing scale token |
| `spacing/12` | `12px` | Spacing scale token |
| `spacing/16` | `16px` | Spacing scale token |
| `spacing/20` | `20px` | Spacing scale token |
| `spacing/24` | `24px` | Spacing scale token |
| `spacing/28` | `28px` | Spacing scale token |
| `spacing/32` | `32px` | Spacing scale token |
| `spacing/36` | `36px` | Spacing scale token |
| `spacing/40` | `40px` | Spacing scale token |
| `spacing/48` | `48px` | Spacing scale token |
| `spacing/64` | `64px` | Spacing scale token |
| `spacing/80` | `80px` | Spacing scale token |
| `spacing/144` | `144px` | Spacing scale token |

## Radius

| Token | Value | Usage |
| --- | --- | --- |
| `radius/0` | `0px` | Corner radius scale token |
| `radius/2` | `2px` | Corner radius scale token |
| `radius/4` | `4px` | Corner radius scale token |
| `radius/6` | `6px` | Corner radius scale token |
| `radius/8` | `8px` | Corner radius scale token |
| `radius/10` | `10px` | Corner radius scale token |
| `radius/12` | `12px` | Corner radius scale token |
| `radius/16` | `16px` | Corner radius scale token |
| `radius/20` | `20px` | Corner radius scale token |
| `radius/circle` | `9999px` | Full-round or pill radius |

## Typography and Styles

### Breakpoint
| Style | Usage |
| --- | --- |
| `Breakpoint/1-480/Column_3` | Grid breakpoint rule |
| `Breakpoint/1-480/Column_4` | Grid breakpoint rule |
| `Breakpoint/481-767/Column_6` | Grid breakpoint rule |
| `Breakpoint/768-1000/Column_6` | Grid breakpoint rule |
| `Breakpoint/768-1000/Column_8` | Grid breakpoint rule |
| `Breakpoint/1001-1366/Column_8_LNB_fold` | Grid breakpoint rule |
| `Breakpoint/1001-1366/Column_12` | Grid breakpoint rule |
| `Breakpoint/1367+/Column_12_Center` | Grid breakpoint rule |
| `Breakpoint/1367+/Column_12_LNB_fold` | Grid breakpoint rule |
| `Breakpoint/1367+/Column_12_LNB_open` | Grid breakpoint rule |

### Elevation
| Style | Usage |
| --- | --- |
| `Elevation/shadow100` | Shadow or elevation |
| `Elevation/shadow200` | Shadow or elevation |
| `Elevation/shadow300` | Shadow or elevation |
| `Elevation/shadow400` | Shadow or elevation |
| `Elevation/shadow500` | Shadow or elevation |

### Table
| Style | Usage |
| --- | --- |
| `테이블 행 52px` | Table layout guidance |
| `테이블/리스트 박스 여백` | Table layout guidance |
| `테이블/테이블 셀 상, 하 패딩` | Table layout guidance |
| `테이블/테이블 첫번째 컬럼 여백` | Table layout guidance |
| `테이블/테이블 체크박스 컬럼 여백` | Table layout guidance |
| `테이블/테이블 컬럼 여백` | Table layout guidance |

### Text
| Style | Usage |
| --- | --- |
| `Server/Body1/medium` | Body copy |
| `Server/Body1/regular` | Body copy |
| `Server/Body1/underline` | Body copy |
| `Server/Body2/long/medium` | Body copy |
| `Server/Body2/long/regular` | Body copy |
| `Server/Body2/long/underline` | Body copy |
| `Server/Body2/medium` | Body copy |
| `Server/Body2/regular` | Body copy |
| `Server/Body2/underline` | Body copy |
| `Server/Body3/medium` | Body copy |
| `Server/Body3/regular` | Body copy |
| `Server/Body3/underline` | Body copy |
| `Server/Body4/medium` | Body copy |
| `Server/Body4/regular` | Body copy |
| `Server/Body4/underline` | Body copy |
| `Server/Caption1/regular` | Caption and helper text |
| `Server/Caption2/bold` | Caption and helper text |
| `Server/Caption2/regular` | Caption and helper text |
| `Server/Heading/H1` | Heading hierarchy |
| `Server/Heading/H2` | Heading hierarchy |
| `Server/Heading/H3` | Heading hierarchy |
| `Server/Sub title/Subtitle1` | Section subtitle |
| `Server/Sub title/Subtitle2` | Section subtitle |
| `Server/Sub title/Subtitle3` | Section subtitle |

## Guidance
- Use semantic tokens first whenever they exist.
- Keep raw palette tokens as implementation references, not as a replacement naming system.
- Maintain enterprise clarity, dense information layout, and predictable interaction states.
- Preserve avatar and badge token families consistently within a single component set.

## Export Notes
- File source: `Agent_skill_test`
- Export method: xbridge `search-design-system` on `local-file`
- Color values are intentionally left unresolved in this export because the current bridge response did not include file-wide resolved color values.