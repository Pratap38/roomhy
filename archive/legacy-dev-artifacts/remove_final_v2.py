#!/usr/bin/env python3

filepath = r'c:\Users\yasmi\OneDrive\Desktop\roomhy finaloiuygtfds\website\property.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Use a regex to find and remove the orphaned similar properties section
import re

# Pattern: find from the div after </main> to the closing </section>
# This matches the orphaned content between </main> tags
pattern = r'<div class="flex items-center space-x-4 mb-10">\s*<h2 class="text-4xl font-bold text-gray-900">Similar Properties Near You</h2>.*?</section>\s*</main>'

# Check if pattern is found
if re.search(pattern, content, re.DOTALL):
    new_content = re.sub(pattern, '</main>', content, flags=re.DOTALL)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('✅ Successfully removed Similar Properties section')
else:
    print('❌ Pattern not found. Trying alternative approach...')
    # Try without </main> at the end
    pattern2 = r'<div class="flex items-center space-x-4 mb-10">\s*<h2[^>]*>Similar Properties Near You</h2>.*?</section>'
    if re.search(pattern2, content, re.DOTALL):
        new_content = re.sub(pattern2, '', content, flags=re.DOTALL)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('✅ Successfully removed Similar Properties section (alternative pattern)')
    else:
        print('❌ Could not find matching pattern')
