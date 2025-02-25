import os
import pandas as pd

# Step 1: Get the current working directory and define paths
cwd = os.getcwd()
excel_file = os.path.join(cwd, 'horieyui_staff_combined.xlsx')
output_txt_file = os.path.join(cwd, 'downloads.txt')

# Function to clean and format the date into a valid filename format
def format_date_for_filename(date_value):
    try:
        # Parse date assuming ISO 8601 format
        if isinstance(date_value, str):
            parsed_date = pd.to_datetime(date_value, utc=True)  # Parse date as UTC
            parsed_date = parsed_date.tz_convert('Asia/Tokyo')  # Convert to JST (UTC+9)
            return parsed_date.strftime('%Y%m%d_%H%M%S')  # Format as YYYYMMDD_HHMMSS for filename
        else:
            return "unknown_date"
    except Exception as e:
        print(f"Error parsing date: {e}")
        return "unknown_date"

# Step 2: Read the Excel file
df = pd.read_excel(excel_file, engine='openpyxl')

# Step 3: Write the formatted dates and URLs to a .txt file
with open(output_txt_file, 'w') as f:
    for idx, row in df.iterrows():
        date_value = row['Date']  # Assuming the Date column is named 'Date'
        image_urls = row['Image']  # Assuming the Image URLs column is named 'Image'
        
        # Format the date
        formatted_date = format_date_for_filename(date_value)

        # Check if there are multiple URLs (separated by commas)
        if pd.notna(image_urls) and isinstance(image_urls, str):
            # Write formatted date and URLs to the file (comma-separated)
            f.write(f"{formatted_date}:{image_urls}\n")

print(f"Conversion complete. Data saved to {output_txt_file}.")
