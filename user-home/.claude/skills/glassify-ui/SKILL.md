---
name: glassify-ui
description: >
  Transform a UI screenshot into a structured Cinema4D/Octane JSON render prompt for
  photorealistic 3D poster art. Use this skill whenever the user uploads a UI screenshot
  (app, website, tool, dashboard) and wants a Cinema4D render prompt, 3D poster, AIGC
  image prompt, or any photorealistic visualization of an interface. The output is always
  a clean JSON file — never prose or Midjourney text strings.
---

# Cinema4D UI Render Skill

Transform a UI screenshot into a structured JSON render prompt for Cinema4D/Octane.
Output purpose: **promotional poster art**, not documentation. Abstraction beats fidelity.

---

## Core Philosophy: "舍得" (Less is More)

A poster is not a screenshot. The JSON you produce must:

- **Simplify layers** — 4–8 layers max. Merge minor UI regions. Omit decorative chrome.
- **Abstract content** — No literal button labels unless they define the product identity.
  Use semantic descriptions: `"primary action buttons row"` not `"Bold / Italic / Underline"`.
- **Elevate the hero** — One layer is the visual anchor (the "hero slab"). Give it the
  prominent glow, active color, and bloom effect. Everything else supports it.
- **No clutter** — Status bars, scrollbars, tooltips, and minor icons: omit entirely
  unless they are distinctive brand elements.
- **Extract interactive controls as micro_elements** — Every visible button, toggle switch,
  pill chip, or CTA must be listed in the `micro_elements` array as an independent glass
  brick with its own z_offset, shape, and tint. Do NOT bury them inside a parent layer's
  `content` description. This is mandatory — missing micro_elements is a critical error.

---

## Step 1 — Analyze the Screenshot

Look at the screenshot and extract:

1. **UI category**: productivity / developer / creative / mobile / web / dashboard
2. **Brand identity signals**: dominant color, logo, product name, characteristic icon
3. **Natural focal region**: which area draws the eye first — that becomes the hero layer
4. **Aspect ratio decision** (if user has not specified):
   - Desktop/web UI with wide layout → `"16:9"`
   - Mobile app or portrait-first UI → `"9:16"`
   - Square or ambiguous → `"1:1"` or `"16:9"` as default

---

## Step 2 — Design the Layer Stack

Collapse the real UI into **4–8 abstract depth layers**, Z-offset spaced 5–6mm apart.
Use this table as a starting template — adapt to the actual UI:

| Layer ID | Typical Role           | Z offset | Thickness | Roughness | Transmission |
|----------|------------------------|----------|-----------|-----------|--------------|
| 0        | App shell / chrome     | 0mm      | 8mm       | 0.20      | 0.50         |
| 1        | Background / canvas    | 5mm      | 6mm       | 0.15      | 0.65         |
| 2        | Main content area      | 10mm     | 5mm       | 0.06      | 0.85         |
| 3        | Primary toolbar/nav    | 15mm     | 5mm       | 0.12      | 0.70         |
| 4        | Hero element           | 20mm     | 4mm       | 0.08      | 0.75         |
| 5        | Floating accent (opt.) | 25mm     | 3mm       | 0.18      | 0.60         |

Rules:
- The **hero layer** gets `glow` and `active_element` with `effect: "backlit_halo_bloom"`
- Content descriptions use **semantic phrases**, never exhaustive lists of UI elements
- Omit Layer 5 if the UI has no natural floating element

### micro_elements (mandatory if interactive controls exist)

After the main layer stack, scan the screenshot for every interactive widget:
buttons, toggle switches, pill chips, dropdown triggers, submit CTAs, radio buttons, sliders.
Each one becomes an entry in `micro_elements` — a separate floating glass brick:

```json
"micro_elements": [
  {
    "id": "me_01",
    "type": "toggle_switch",
    "label_semantic": "Computer mode toggle — active state",
    "parent_layer_id": 1,
    "z_offset_mm": 28,
    "shape": "pill",
    "size": "small",
    "material": {
      "thickness_mm": 2.5,
      "roughness": 0.05,
      "transmission": 0.80,
      "tint": "accent_blue"
    },
    "glow": {
      "color": "#4AA8FF",
      "intensity": 0.5,
      "radius_mm": 6,
      "effect": "edge_rim_glow"
    }
  }
]
```

`type` values: `button_primary`, `button_secondary`, `toggle_switch`, `pill_chip`,
`dropdown_trigger`, `icon_button`, `cta_submit`.
`shape` values: `rectangle`, `pill`, `circle`, `square`.
`tint` values: `accent_blue`, `accent_teal`, `neutral_white`, `clear`, `warm_white`, `cool_white`.

---

## Step 3 — Choose Environment & Tone

Default white balance is **neutral-to-slightly-cool** (5200–5600K). Avoid warm golden tones
unless explicitly requested. Match environment to UI category:

| UI Category      | Environment                       | Tone         | Palette               |
|------------------|-----------------------------------|--------------|-----------------------|
| Productivity     | bright_minimal_desk_daylight      | neutral_cool | clean_daylight        |
| Developer / Code | dark_minimalist_desk_led_strip    | cool         | cool_white_led        |
| Creative / Design| architects_drafting_table         | neutral_cool | soft_overcast         |
| Mobile App       | white_marble_surface_lifestyle    | neutral_cool | clean_daylight        |
| Dashboard / Data | glass_conference_table            | cool         | morning_cool_light    |

Props are 2–3 contextually appropriate objects, soft bokeh background.
UI float height: 15–20cm above surface.

---

## Step 4 — Output the JSON

Produce exactly this structure. No extra fields, no prose, no markdown around the JSON.

```json
{
  "task": "photorealistic_3d_render",
  "renderer": "Cinema4D_Octane",
  "resolution": "8K",
  "aspect_ratio": "<16:9 | 9:16 | 1:1>",
  "source_ui": "<product name — short description>",

  "negative_prompt": [
    "no annotation text",
    "no dimension labels",
    "no callout lines",
    "no layer name overlays",
    "no technical labels in scene",
    "no dark mode UI",
    "no dark backgrounds on UI panels",
    "no `Layer 1`, `Layer 2`, ..., `Layer N` callouts and annotations"
  ],

  "layers": [
    {
      "id": 0,
      "name": "<semantic_name>",
      "z_offset_mm": 0,
      "content": ["<abstract description, max 2 items>"],
      "material": {
        "thickness_mm": 8,
        "roughness": 0.20,
        "transmission": 0.50,
        "tint": "<neutral_gray | warm_white | cool_white | clear>"
      },
      "glow": null
    }
  ],

  "micro_elements": [
    {
      "id": "me_01",
      "type": "<button_primary | button_secondary | toggle_switch | pill_chip | dropdown_trigger | icon_button | cta_submit>",
      "label_semantic": "<what this control does, not its literal text>",
      "parent_layer_id": 1,
      "z_offset_mm": 28,
      "shape": "<rectangle | pill | circle | square>",
      "size": "<small | medium | large>",
      "material": {
        "thickness_mm": 2.5,
        "roughness": 0.05,
        "transmission": 0.80,
        "tint": "<accent_blue | accent_teal | neutral_white | clear | cool_white>"
      },
      "glow": null
    }
  ],

  "hero_layer_id": "<integer>",

  "material_global": {
    "type": "frosted_acrylic_glass",
    "edge_bevel_mm": 1.5,
    "chromatic_aberration": true,
    "ray_traced_reflections": true,
    "ambient_occlusion_between_layers": true
  },

  "environment": {
    "scene": "<environment_key>",
    "surface": "<material>",
    "props": ["<prop_1>", "<prop_2>"],
    "ui_float_height_cm": 18,
    "caustic_shadow_on_desk": true
  },

  "camera": {
    "angle": "three_quarter_perspective",
    "tilt_degrees": 10,
    "position": "slightly_right_of_center",
    "focal_length_mm": 100,
    "aperture": "f/1.2",
    "bokeh_blur": true,
    "focus_target": "layer_<hero_id>",
    "dof_blur_layers": [0, 1, "environment"]
  },

  "lighting": {
    "tone": "neutral_cool",
    "white_balance_kelvin": 5400,
    "palette": "<palette_key>",
    "key":  { "position": "top_center",  "color": "#F5F8FF",  "type": "soft_area"    },
    "rim":  { "position": "upper_left",  "color": "#C8DEFF",  "type": "backlit_edge" },
    "fill": { "position": "lower_right", "color": "#EAF0FF",  "type": "bounce"       }
  },

  "style_tags": [
    "photorealistic",
    "Fluent_Design",
    "physically_based",
    "light_mode_ui",
    "neutral_cool_white_balance",
    "no_annotation_text",
    "no_cartoon",
    "no_flat",
    "no_watermark"
  ]
}
```

---

## Quality Checklist (self-review before output)

Before writing the final JSON, verify:

- [ ] Layer count is 4–8, not more
- [ ] Each `content` array has ≤ 3 items, all semantic (no literal button labels)
- [ ] Exactly one layer has a `glow` value and an `active_element`
- [ ] `hero_layer_id` matches that layer's `id`
- [ ] `focus_target` in camera matches `hero_layer_id`
- [ ] Environment and tone are consistent — default is **neutral_cool**, never warm/golden unless user asked
- [ ] `white_balance_kelvin` is set (5200–5600K range for neutral cool)
- [ ] `negative_prompt` array is present and includes annotation-text suppressors
- [ ] `micro_elements` array is present if the UI has any buttons, toggles, or chips
- [ ] Every button / toggle / pill in the screenshot has a corresponding `micro_element` entry
- [ ] `style_tags` includes `"light_mode_ui"` and `"no_annotation_text"`
- [ ] Aspect ratio is decided and justified
- [ ] No `midjourney_suffix` or prose fields present
