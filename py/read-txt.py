import os

# Step 1: Get the current working directory and define paths
cwd = os.getcwd()
txt_file = os.path.join(cwd, 'downloads.txt')

# Step 2: Function to count valid URLs in a line
def count_valid_urls_from_line(urls):
    urls_list = urls.split(',')
    valid_urls = [url.strip() for url in urls_list if url.strip()]  # Remove empty strings
    return len(valid_urls)

# Step 3: Read the .txt file line by line
with open(txt_file, 'r') as f:
    for line in f:
        formatted_date, urls = line.strip().split(':', 1)  # Split on the first occurrence of ':'
        
        # Count valid URLs in the line
        valid_url_count = count_valid_urls_from_line(urls)
        
        # Print out the date and the count of valid URLs
        print(f"Date: {formatted_date}, Valid URL count: {valid_url_count}")
