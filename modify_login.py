import re

with open('/tmp/old-login-modal.tsx', 'r') as f:
    content = f.read()

# Replace main wrapper bg
content = content.replace('className="fixed inset-0 z-[9999] bg-[#060816] flex overflow-hidden lg:grid lg:grid-cols-2"', 
                          'className="fixed inset-0 z-[9999] bg-[#0B0A10] flex overflow-hidden lg:grid lg:grid-cols-2"')

# Insert homepage background right after <LoginStyles />
bg_insert = """
          {/* ENHANCED HOMEPAGE BACKGROUND */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#0B0A10]">
            {/* Grid Glow */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [perspective:1000px] [transform-style:preserve-3d]">
               <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A10] via-transparent to-[#0B0A10]" />
            </div>
            
            {/* Gradient Blobs */}
            <motion.div 
              animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px]"
            />
            <motion.div 
              animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]"
            />
          </div>
"""
content = content.replace('<LoginStyles />', '<LoginStyles />' + bg_insert)

# Make panels transparent so background shows through
content = content.replace('bg-[#0B1020]', 'bg-transparent z-10')
content = content.replace('bg-[#060816]', 'bg-transparent z-10')

# Remove old left panel gradient
old_grad = """            {/* Animated Gradient Background */}
            <div 
              className="absolute inset-0 login-gradient-move opacity-70"
              style={{
                background: `
                  radial-gradient(circle at 30% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
                  radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
                `
              }}
            />
            
            {/* Grid Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-50" />"""
content = content.replace(old_grad, "")

# Remove subtle background glow for right panel as well to let global bg shine
old_glow = """            {/* Subtle background glow for right panel */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15)_0%,transparent_60%)]" />"""
content = content.replace(old_glow, "")

# Update accent colors to match the purple/indigo theme of homepage instead of cyan/blue
content = content.replace('text-cyan-400', 'text-purple-400')
content = content.replace('bg-cyan-400', 'bg-purple-400')
content = content.replace('border-cyan-400', 'border-purple-400')
content = content.replace('shadow-[0_0_10px_#06b6d4]', 'shadow-[0_0_10px_#c084fc]')
content = content.replace('shadow-[0_0_20px_rgba(6,182,212,0.3)]', 'shadow-[0_0_20px_rgba(168,85,247,0.3)]')
content = content.replace('from-cyan-400 to-blue-500', 'from-purple-500 to-indigo-500')
content = content.replace('from-blue-500 to-purple-500', 'from-indigo-500 to-purple-600')

with open('src/app/components/login-modal.tsx', 'w') as f:
    f.write(content)

