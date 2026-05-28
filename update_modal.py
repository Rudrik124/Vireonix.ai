with open('src/app/components/login-modal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'backdrop-blur-md"',
    'backdrop-blur-md modal-close"'
)

with open('src/app/components/login-modal.tsx', 'w') as f:
    f.write(content)
