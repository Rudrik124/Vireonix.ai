with open('src/app/main/landing-page.tsx', 'r') as f:
    content = f.read()

# Add gpu class to heavy animated divs (like the floating cards)
content = content.replace('className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] max-w-[500px] bg-[#1A1A24]/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden transform-gpu"',
                          'className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] max-w-[500px] bg-[#1A1A24]/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden gpu"')

# Add loading="lazy" to images
content = content.replace('<img src="https://images.unsplash.com', '<img loading="lazy" decoding="async" src="https://images.unsplash.com')

with open('src/app/main/landing-page.tsx', 'w') as f:
    f.write(content)
