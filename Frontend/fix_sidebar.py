with open("/Users/manjithsingh/Documents/Github/Vireonix.ai/Frontend/src/app/components/user-profile-sidebar.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Sign Out" in line:
        # found sign out button
        idx = i + 2 # the </button>
        break

new_lines = lines[:idx] + ["            </div>\n", "    </div>\n", "  );\n"] + lines[idx+5:]

with open("/Users/manjithsingh/Documents/Github/Vireonix.ai/Frontend/src/app/components/user-profile-sidebar.tsx", "w") as f:
    f.writelines(new_lines)
