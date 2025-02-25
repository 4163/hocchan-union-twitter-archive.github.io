import os
import pandas as pd

# Step 1: Get the current working directory and define paths
cwd = os.getcwd()
excel_file = os.path.join(cwd, 'horieyui_staff_combined.xlsx')

# Step 2: Read the Excel file
df = pd.read_excel(excel_file, engine='openpyxl')

# Step 3: Function to count valid URLs
def count_valid_urls(image_column):
    if pd.notna(image_column) and isinstance(image_column, str):
        # Split the column by commas and return the count of valid URLs
        urls = image_column.split(',')
        valid_urls = [url.strip() for url in urls if url.strip()]  # Remove empty strings
        return len(valid_urls)
    return 0

# Step 4: Iterate over each row and count valid URLs
for idx, row in df.iterrows():
    date_value = row['Date']  # Assuming the Date column is named 'Date'
    image_column = row['Image']  # Assuming the Image URLs column is named 'Image'
    
    # Count valid URLs in the 'Image' column
    valid_url_count = count_valid_urls(image_column)
    
    # Print out the date and the count of valid URLs
    print(f"Date: {date_value}, Valid URL count: {valid_url_count}")
