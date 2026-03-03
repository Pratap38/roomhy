import re

# Read the file
with open('website/property.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Strategy 1: Remove from "Similar Properties" heading down to the closing button and section
# Find the start: "Similar Properties Near You"
pattern = r'<div class="flex items-center space-x-4 mb-10">\s*<h2[^>]*>Similar Properties Near You</h2>.*?<button id="similar-next"[^>]*>.*?</button>\s*</div>\s*</section>'

content = re.sub(pattern, '', content, flags=re.DOTALL)

# Write back
with open('website/property.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Similar Properties section removed from property.html')
