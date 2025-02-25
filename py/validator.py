import logging
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(filename='validation.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def validate_html(file_path):
    logging.info(f"Starting validation for {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Parse the HTML content
    soup = BeautifulSoup(content, 'html.parser')
    logging.info("HTML content parsed successfully.")
    
    # Find all tags
    all_tags = soup.find_all(True)
    logging.info(f"Found {len(all_tags)} tags in the document.")
    
    # Check for unclosed tags
    unclosed_tags = 0
    for tag in all_tags:
        if not tag.is_self_closing and not tag.find_all_next(tag.name):
            logging.warning(f"Unclosed tag found: <{tag.name}> at line {tag.sourceline}")
            unclosed_tags += 1
    
    if unclosed_tags == 0:
        logging.info("No unclosed tags found.")
    else:
        logging.info(f"Total unclosed tags found: {unclosed_tags}")
    
    logging.info("Validation complete.")

# Specify the path to your HTML file
file_path = 'html-structure.html'
validate_html(file_path)
