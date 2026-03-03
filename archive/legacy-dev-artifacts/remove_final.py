#!/usr/bin/env python3
import os

filepath = r'c:\Users\yasmi\OneDrive\Desktop\roomhy finaloiuygtfds\website\property.html'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with 'Similar Properties Near You'
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if 'Similar Properties Near You' in line:
        # Go back to find the opening div
        for j in range(i, max(0, i-10), -1):
            if '<div class="flex items-center space-x-4 mb-10">' in lines[j]:
                start_idx = j
                break
        break

if start_idx is not None:
    # Find the closing </section> after start
    for i in range(start_idx, len(lines)):
        if '</section>' in lines[i] and i > start_idx + 5:
            end_idx = i
            break

if start_idx is not None and end_idx is not None:
    # Remove from start_idx to end_idx (inclusive)
    new_lines = lines[:start_idx] + lines[end_idx+1:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f'✅ Removed lines {start_idx+1} to {end_idx+1} ({end_idx-start_idx+1} lines deleted)')
else:
    print('❌ Could not find section to remove')
    print(f'start_idx: {start_idx}, end_idx: {end_idx}')
