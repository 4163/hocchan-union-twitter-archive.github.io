import re  # Import regular expressions
import os
import pandas as pd
from datetime import datetime, timedelta
from dateutil import parser
import pytz  # or: from zoneinfo import ZoneInfo (Python 3.9+)

# User-configurable parameters
profile_picture = "Media/@10th_anniv/VqIaiLiV_400x400.jpg"
username = "Aice⁵"
handle = "@10th_anniv"
minify_html = True  # Set to True to minify the HTML output

# Step 1: Read the Excel file
cwd = os.getcwd()
excel_file = os.path.join(cwd, '2015.xlsx')  # Adjusted the filename to your context
df = pd.read_excel(excel_file)

# Step 2: Explicitly cast 'Like', 'Retweet', and 'Reply' columns to Int64 (which supports NaN)
df['Like'] = pd.to_numeric(df['Like'], errors='coerce').astype('Int64')
df['Retweet'] = pd.to_numeric(df['Retweet'], errors='coerce').astype('Int64')
df['Reply'] = pd.to_numeric(df['Reply'], errors='coerce').astype('Int64')

# Step 3: Replace NaN values with '---' only for non-numeric columns
# Select only non-numeric columns
non_numeric_columns = df.select_dtypes(exclude=['number']).columns
df[non_numeric_columns] = df[non_numeric_columns].fillna('---')

# Step 4: Initialize variables for HTML output and media tracking
html_output = []
tweet_count = 1  # To generate tweet-XXXX class dynamically

# Function to check if a string is in ISO 8601 date format
def is_iso8601(date_string):
    try:
        parser.isoparse(date_string)
        return True
    except (ValueError, TypeError): 
        return False

# Function to convert ISO 8601 timestamp to JST (Japan Standard Time) format
def format_timestamp(iso_string):
    # Parse the timestamp and handle timezone conversion properly
    dt = parser.isoparse(iso_string)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=pytz.UTC)
    jst = pytz.timezone('Asia/Tokyo')
    dt_jst = dt.astimezone(jst)
    return dt_jst.strftime('%I:%M %p · %b %d, %Y JST').lstrip('0')

# Function to format the date into a filename format (YYYYMMDD_HHMMSS)
def format_date_for_filename(date_value):
    try:
        if isinstance(date_value, str):
            dt = parser.isoparse(date_value)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=pytz.UTC)
            jst = pytz.timezone('Asia/Tokyo')
            dt_jst = dt.astimezone(jst)
            return dt_jst.strftime('%Y%m%d_%H%M%S')
        return "unknown_date"
    except Exception as e:
        print(f"Error parsing date: {e}")
        return "unknown_date"

# Updated function to format text in Content column
def format_text(text):
    text = str(text).strip()  
    
    # Wrap 'https' links first to avoid conflicts
    wrapped_text = re.sub(
        r'(https://\S+)',
        r'<a href="" class="colored-link">\1</a>',
        text
    )
    
    # Handle hashtags
    wrapped_text = re.sub(
        r'(^|\s)(#[a-zA-Z0-9ぁ-んァ-ン一-龯ー々]+)',  
        r'\1<a href="" class="colored-link">\2</a>',
        wrapped_text
    )

    # Handle mentions with an exception for the current handle
    wrapped_text = re.sub(
        r'(^|\s)(@[a-zA-Z0-9_]+)',  
        lambda match: match.group(0) if match.group(2) == handle else f'{match.group(1)}<a href="" class="colored-link">{match.group(2)}</a>',
        wrapped_text
    )

    # Replace specific emojis
    wrapped_text = wrapped_text.replace(
        "🐈‍⬛", '<img src="../svg/1f408-200d-2b1b.svg" class="kuroneko">'
    )

    # Replace newlines with <br> tags for HTML formatting
    final_formatted_text = wrapped_text.replace('\n', '<br>')

    # Print the text before substitution for debugging
    print("Before substitution:", final_formatted_text)

    # Directly replace the specific pattern
    final_formatted_text = final_formatted_text.replace(
        '</a> <a href="" class="colored-link">',
        '</a>&nbsp;<a href="" class="colored-link">'
    )

    # Print the text after substitution for debugging
    print("After substitution:", final_formatted_text)
    
    return final_formatted_text.strip()


# Step 5: Iterate over each row in the DataFrame
for index, row in df.iterrows():
    if isinstance(row['Date'], str) and is_iso8601(row['Date']):
        column_a = format_timestamp(row['Date'])
        date_filename = format_date_for_filename(row['Date'])
    else:
        column_a = str(row['Date'])
        date_filename = "unknown_date"

    # Handle column B (Post Type: image/text handling)
    media_html = ''
    if row['Post Type'] == 'image':
        images = row['Image'].split(',')
        media_html = ''.join([
            f'<div class="media"><img data-src="../Media/{handle}/{date_filename}{f"_{i+1}" if i > 0 else ""}.jpg"></div>'
            for i in range(len(images))
        ])

    # Format column C (Content text)
    column_c = format_text(row['Content'])

    # Extract and format Like, Retweet, Reply
    column_d = row['Like'] if pd.notna(row['Like']) else '---'
    column_e = row['Retweet'] if pd.notna(row['Retweet']) else '---'
    column_f = row['Reply'] if pd.notna(row['Reply']) else '---'

    # Step 6: Construct the tweet-contents HTML using the new template
    template = '''<div class="tweet-block {tweet_class}">
                <div class="content-button"><img src="../svg/three-dots.svg"></div>
                <div class="contents">
                <a href="" class="post-profile"><img src="../{pfp}"></a>
                    <div class="tweet-contents">
                        <div class="tweet-header">
                            <a href="">{username}</a><span>{handle}</span><span>·</span>
                            <a href="" class="date">{date}</a>
                        </div>
                        <div class="tweet">{content}</div>{media}
                        <div class="interactions">
                            <a href="" class="comment"><img src="../svg/comment.svg"><span>{reply}</span></a>
                            <a href="" class="retweet"><img src="../svg/retweet.svg"><span>{retweet}</span></a>
                            <a href="" class="like"><img src="../svg/heart.svg"><span>{like}</span></a>
                        </div>
                    </div>
                </div>
            </div>'''

    full_html_structure = template.format(
        tweet_class=f"tweet-{tweet_count:04d}",
        pfp=profile_picture,
        username=username,
        handle=handle,
        date=column_a,
        content=column_c,
        media=media_html,
        reply=column_f,
        retweet=column_e,
        like=column_d
    )

    # Append the full HTML structure for this row to the output, ensuring each is on a new line
    html_output.append('\t\t\t' + full_html_structure + '\n')
    tweet_count += 1  # Increment tweet counter

# Step 8: Write the output to an HTML file without extra empty lines
html_file = os.path.join(cwd, 'html-structure.html')
with open(html_file, 'w', encoding='utf-8') as f:
    for html in html_output:
        if minify_html:
            # Remove spaces between HTML elements, but preserve &nbsp;
            html = re.sub(r'>\s+<', '><', html)
            html = html.replace('&amp;nbsp;', '&nbsp;')  # Ensure &nbsp; is preserved

        # Replace &nbsp; between links with a regular space
        html = html.replace('</a>&nbsp;<a href="" class="colored-link">', '</a> <a href="" class="colored-link">')

        f.write(html)

print(f"HTML output saved to {html_file}")
