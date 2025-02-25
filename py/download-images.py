import os
import requests
from urllib.parse import urlsplit, urlunsplit

# Step 1: Get the current working directory and create the '@10th_anniv' folder inside 'Media' if it doesn't exist
cwd = os.getcwd()
media_folder = os.path.join(cwd, 'Media', '@10th_anniv')
os.makedirs(media_folder, exist_ok=True)

# Step 2: Define input .txt file path
txt_file = os.path.join(cwd, 'downloads.txt')

# Step 3: Function to format the URL as 'https://pbs.twimg.com/media/<image_id>?format=jpg&name=large'
def format_url(url):
    parts = urlsplit(url)
    formatted_url = urlunsplit((parts.scheme, parts.netloc, parts.path, 'format=jpg&name=large', ''))
    return formatted_url

# Step 4: Read the .txt file line by line and download the images
with open(txt_file, 'r') as f:
    for line in f:
        # Split only on the first occurrence of ':'
        formatted_date, urls = line.strip().split(':', 1)
        urls_list = urls.split(',')

        # Step 5: Download each URL
        for i, url in enumerate(urls_list):
            # Format the URL as required
            formatted_url = format_url(url)

            # Construct the filename (add suffix for multiple URLs)
            if i == 0:
                filename = f"{formatted_date}.jpg"
            else:
                filename = f"{formatted_date}_{i+1}.jpg"

            # Check if the file already exists in the folder
            file_path = os.path.join(media_folder, filename)
            if os.path.exists(file_path):
                print(f"Skipping {file_path}, already exists.")
                continue  # Skip this file

            try:
                # Send a GET request to download the image
                response = requests.get(formatted_url, stream=True)

                # Check if the request was successful
                if response.status_code == 200:
                    # Save the image to the '@10th_anniv' folder inside 'Media'
                    with open(file_path, 'wb') as img_file:
                        img_file.write(response.content)

                    print(f"Downloaded: {file_path}")
                else:
                    print(f"Failed to download: {formatted_url} (Status code: {response.status_code})")
            except Exception as e:
                print(f"Error downloading {formatted_url}: {e}")

print("Download complete.")
