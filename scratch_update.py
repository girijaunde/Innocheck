import re
import os

app_path = "backend/app_simple.py"
with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# ----------------- 1. IMPLEMENT DYNAMIC CODESTUDIO BUILDER & ALIASES -----------------
builder_code = """
def build_prototype_html(description: str, template_type: str, color_scheme: str) -> str:
    # Color schemes
    if color_scheme == "dark":
        bg_style = "background-color: #0b0f19; color: #f8fafc;"
        card_style = "background-color: #161d30; border-color: #1f293d; color: #f8fafc;"
        text_muted = "color: #94a3b8;"
        text_title = "color: #ffffff;"
        input_style = "background-color: #1f293d; border-color: #374151; color: #ffffff;"
        btn_primary = "background-color: #4f46e5; color: #ffffff; hover: bg-indigo-700"
    elif color_scheme == "brand":
        bg_style = "background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; min-height: 100vh;"
        card_style = "background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff;"
        text_muted = "color: #e0e7ff;"
        text_title = "color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.1);"
        input_style = "background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); color: #ffffff;"
        btn_primary = "background-color: #ffffff; color: #4f46e5; hover: bg-slate-100"
    else: # light
        bg_style = "background-color: #f8fafc; color: #1e293b;"
        card_style = "background-color: #ffffff; border-color: #e2e8f0; color: #1e293b;"
        text_muted = "color: #64748b;"
        text_title = "color: #0f172a;"
        input_style = "background-color: #ffffff; border-color: #cbd5e1; color: #1e293b;"
        btn_primary = "background-color: #4f46e5; color: #ffffff; hover: bg-indigo-700"

    # Templates
    if template_type == "landing":
        html = f\"\"\"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="{bg_style}" class="font-sans min-h-screen flex flex-col justify-between">
  <header class="flex justify-between items-center p-6 border-b border-slate-500/10 shrink-0">
    <span class="text-sm font-black" style="{text_title}">🚀 InnoCheck Platform</span>
    <button class="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full hover:bg-indigo-700 transition">Get Started</button>
  </header>

  <main class="my-auto py-12 text-center space-y-6 max-w-xl mx-auto shrink-0 px-4">
    <h1 class="text-4xl font-black tracking-tight leading-tight" style="{text_title}">
      {description}
    </h1>
    <p class="text-xs leading-relaxed" style="{text_muted}">
      Deploy your tech prototypes and validate ideas instantly using the core InnoCheck engine. Custom styles and features compiled.
    </p>
    <div class="flex justify-center gap-3">
      <button onclick="alert('Demo Activated!')" class="text-[10px] font-black px-6 py-3 rounded-full shadow hover:scale-[1.02] transition-all" style="{btn_primary}">Explore Platform</button>
      <button onclick="alert('Documentation coming soon!')" class="border text-[10px] font-black px-6 py-3 rounded-full hover:bg-slate-500/5 transition" style="border-color: currentColor;">Documentation</button>
    </div>
  </main>

  <footer class="text-center text-[9px] pt-4 border-t border-slate-500/10 shrink-0 pb-4" style="{text_muted}">
    © 2026 InnoCheck Workspace. Landing page layout.
  </footer>
</body>
</html>\"\"\"
    elif template_type == "dashboard":
        html = f\"\"\"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="{bg_style}" class="font-sans min-h-screen p-6">
  <header class="flex justify-between items-center border-b border-slate-500/10 pb-4 mb-6">
    <div>
      <h1 class="text-lg font-black" style="{text_title}">📊 Analytics Workbench</h1>
      <p class="text-[10px]" style="{text_muted}">Overview of: {description}</p>
    </div>
    <span class="text-[9px] bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">Live telemetry</span>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div class="p-5 rounded-2xl border" style="{card_style}">
      <span class="text-[9px] font-bold uppercase tracking-wider" style="{text_muted}">Total Events</span>
      <div class="text-2xl font-black mt-1" style="{text_title}">12,482</div>
      <p class="text-[9px] text-emerald-500 mt-1">▲ +8.2% vs baseline</p>
    </div>
    <div class="p-5 rounded-2xl border" style="{card_style}">
      <span class="text-[9px] font-bold uppercase tracking-wider" style="{text_muted}">Processing Latency</span>
      <div class="text-2xl font-black mt-1" style="{text_title}">1.26s</div>
      <p class="text-[9px] text-indigo-500 mt-1">● Optimal rating</p>
    </div>
    <div class="p-5 rounded-2xl border" style="{card_style}">
      <span class="text-[9px] font-bold uppercase tracking-wider" style="{text_muted}">System Health</span>
      <div class="text-2xl font-black mt-1" style="{text_title}">99.98%</div>
      <p class="text-[9px] text-emerald-500 mt-1">✓ Active mesh relays</p>
    </div>
  </div>

  <div class="rounded-2xl border p-4" style="{card_style}">
    <h3 class="font-bold text-xs mb-3" style="{text_title}">Recent Action Logs</h3>
    <div class="space-y-2 text-[10px]">
      <div class="flex justify-between p-2 rounded bg-black/10">
        <span>Telemetry packet dispatched to outposts</span>
        <span style="{text_muted}">Just now</span>
      </div>
      <div class="flex justify-between p-2 rounded bg-black/10">
        <span>Database initialized and tables created</span>
        <span style="{text_muted}">3 mins ago</span>
      </div>
    </div>
  </div>
</body>
</html>\"\"\"
    elif template_type == "form":
        html = f\"\"\"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuration Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="{bg_style}" class="font-sans min-h-screen p-6 flex items-center justify-center">
  <div class="w-full max-w-sm rounded-2xl border p-6 shadow-lg" style="{card_style}">
    <div class="mb-5">
      <h2 class="text-lg font-black" style="{text_title}">Configure Settings</h2>
      <p class="text-[10px]" style="{text_muted}">Target: {description}</p>
    </div>

    <form onsubmit="event.preventDefault(); alert('Settings saved successfully!');" class="space-y-4 text-[10px] font-bold">
      <div>
        <label class="block uppercase tracking-wider mb-1.5" style="{text_muted}">Primary Endpoint Name</label>
        <input type="text" required style="{input_style}" class="w-full rounded-lg p-2.5 outline-none text-xs border" value="{description.split()[0] if description.split() else 'Prototype'}" />
      </div>
      <div>
        <label class="block uppercase tracking-wider mb-1.5" style="{text_muted}">Operational Key Threshold</label>
        <input type="number" required style="{input_style}" class="w-full rounded-lg p-2.5 outline-none text-xs border" value="85" />
      </div>
      <div>
        <label class="block uppercase tracking-wider mb-1.5" style="{text_muted}">System Environment</label>
        <select style="{input_style}" class="w-full rounded-lg p-2.5 outline-none text-xs border bg-transparent">
          <option value="prod" class="text-slate-800">Production Gateway</option>
          <option value="staging" class="text-slate-800">Staging Outpost</option>
          <option value="dev" class="text-slate-800">Development Sandbox</option>
        </select>
      </div>

      <button type="submit" class="w-full py-2.5 rounded-lg font-extrabold text-[11px] tracking-wider shadow-md active:scale-95 transition-all" style="{btn_primary}">
        SAVE CONFIGURATION
      </button>
    </form>
  </div>
</body>
</html>\"\"\"
    elif template_type == "ecommerce":
        html = f\"\"\"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketplace Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="{bg_style}" class="font-sans min-h-screen p-6">
  <header class="flex justify-between items-center border-b border-slate-500/10 pb-4 mb-6">
    <div>
      <h1 class="text-lg font-black" style="{text_title}">🛍️ Project Storefront</h1>
      <p class="text-[10px]" style="{text_muted}">Marketplace for: {description}</p>
    </div>
    <button onclick="alert('Cart is empty')" class="text-[10px] font-bold border border-slate-300 dark:border-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-500/5">Cart (0)</button>
  </header>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="rounded-2xl border p-4 flex flex-col justify-between" style="{card_style}">
      <div>
        <div class="h-28 rounded-xl bg-indigo-500/10 border mb-3 flex items-center justify-center text-2xl">📦</div>
        <h3 class="font-bold text-xs" style="{text_title}">Standard Telemetry Node</h3>
        <p class="text-[10px] mt-1" style="{text_muted}">Fully calibrated LoRaWAN mesh transmitter node.</p>
      </div>
      <div class="flex justify-between items-center mt-4">
        <span class="font-black text-xs" style="{text_title}">$45.00</span>
        <button onclick="alert('Item added!')" class="text-[9px] font-bold px-3 py-1.5 rounded bg-indigo-600 text-white">Add</button>
      </div>
    </div>
    <div class="rounded-2xl border p-4 flex flex-col justify-between" style="{card_style}">
      <div>
        <div class="h-28 rounded-xl bg-purple-500/10 border mb-3 flex items-center justify-center text-2xl">🛡️</div>
        <h3 class="font-bold text-xs" style="{text_title}">ZK-Credential Module</h3>
        <p class="text-[10px] mt-1" style="{text_muted}">Decentralized cryptographic credential verification package.</p>
      </div>
      <div class="flex justify-between items-center mt-4">
        <span class="font-black text-xs" style="{text_title}">$120.00</span>
        <button onclick="alert('Item added!')" class="text-[9px] font-bold px-3 py-1.5 rounded bg-indigo-600 text-white">Add</button>
      </div>
    </div>
  </div>
</body>
</html>\"\"\"
    else: # blank
        html = f\"\"\"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blank Template</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="{bg_style}" class="font-sans min-h-screen p-6 flex flex-col items-center justify-center text-center">
  <div class="w-full max-w-md rounded-2xl border p-8" style="{card_style}">
    <h1 class="text-2xl font-black mb-3" style="{text_title}">✨ {description}</h1>
    <p class="text-xs leading-relaxed" style="{text_muted}">
      This is a clean template layout scaffolded by CodeStudio AI. You can select other templates or use settings to modify styles.
    </p>
  </div>
</body>
</html>\"\"\"
    return html
"""

# Insert builder_code right after imports or at top level
content = content.replace("load_dotenv()", "load_dotenv()\n" + builder_code)

# ----------------- 2. UPDATE CODESTUDIO PROTOTYPE FALLBACK IN APP_SIMPLE -----------------
# Let's inspect the fallback in @app.post("/api/codestudio/prototype")
# It starts at: `desc_lower = request.description.lower()` on line 2082
# We replace from line 2082 to 2286:
old_proto_fallback_pattern = """    desc_lower = request.description.lower()
    
    bg_color = "bg-slate-950 text-slate-100" if request.color_scheme == "dark" else "bg-slate-50 text-slate-800"
    card_bg = "bg-slate-900/60 border-slate-800 text-slate-100" if request.color_scheme == "dark" else "bg-white border-slate-200 text-slate-800"
    sub_text = "text-slate-400" if request.color_scheme == "dark" else "text-slate-500"
    title_text = "text-white" if request.color_scheme == "dark" else "text-slate-900"
    input_bg = "bg-white/5 border-white/10 text-white" if request.color_scheme == "dark" else "bg-slate-50 border-slate-200 text-slate-900"
    
    if any(k in desc_lower for k in ["tourist", "safety", "incident", "travel", "sos", "fall"]):
        html = f\"\"\"<!DOCTYPE html>"""

# Since it varies, let's target from line 2082 to line 2286 by parsing the structure:
# We find:
# return {
#     "success": True,
#     "html": html,
#     "css": "",
#     "js": ""
# }
# and replace the block preceding it.
start_fallback_marker = "    desc_lower = request.description.lower()\n    \n    bg_color = "
end_fallback_marker = """    return {
        "success": True,
        "html": html,
        "css": "",
        "js": ""
    }"""

# Let's do a direct replace:
new_proto_fallback = """    html = build_prototype_html(request.description, request.template_type, request.color_scheme)
    return {
        "success": True,
        "html": html,
        "css": "",
        "js": ""
    }"""

# Let's locate and slice this block:
start_idx = content.find(start_fallback_marker)
end_idx = content.find(end_fallback_marker) + len(end_fallback_marker)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_proto_fallback + content[end_idx:]
    print("✓ Successfully replaced codestudio prototype fallback logic!")
else:
    print("✗ Failed to locate codestudio prototype fallback markers. Searching alternate patterns...")
    # Alternate search via regex
    pattern = r"    desc_lower = request\.description\.lower\(\).*?return \{\s*\"success\": True,\s*\"html\": html,\s*\"css\": \"\",\s*\"js\": \"\"\s*\}"
    content, count = re.subn(pattern, new_proto_fallback, content, flags=re.DOTALL)
    print(f"✓ Replaced with regex: {count} matches")

# ----------------- 3. REGISTER CODESTUDIO ALIASES -----------------
aliases_code = """
@app.post("/api/codestudio/seed")
async def codestudio_seed(request: MockDataRequest):
    return await codestudio_mock_data(request)

@app.post("/api/codestudio/pitch")
async def codestudio_pitch(request: PitchDeckRequest):
    return await codestudio_pitch_deck(request)

@app.post("/api/codestudio/export")
async def codestudio_export(request: ExportPlatformRequest):
    return await codestudio_export_platform(request)
"""
# Insert aliases near save-project or before uvicorn run
content = content.replace("@app.post(\"/api/codestudio/save-project\")", aliases_code + "\n@app.post(\"/api/codestudio/save-project\")")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✓ Patched CodeStudio logic in app_simple.py successfully!")
