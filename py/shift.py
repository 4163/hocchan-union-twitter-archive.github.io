import re

def renumber_tweets(file_path, start_number):
    # Read the HTML file
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Find all tweet-XXXX occurrences
    tweet_numbers = re.findall(r'tweet-\d{4}', content)
    
    if not tweet_numbers:
        print("No tweet numbers found in the file.")
        return
    
    # Sort and remove duplicates to process in order
    tweet_numbers = sorted(set(tweet_numbers))
    
    # Create new content by replacing old numbers with new ones
    new_content = content
    for i, old_number in enumerate(tweet_numbers):
        new_number = f'tweet-{(start_number + i):04d}'
        new_content = new_content.replace(old_number, new_number)
    
    # Write the modified content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(new_content)
    
    print(f"Successfully renumbered tweets starting from {start_number:04d}")

if __name__ == "__main__":
    file_path = "shift.html"  # Assuming the HTML file is in the same directory
    try:
        start_num = int(input("Enter the starting number for tweet renumbering: "))
        renumber_tweets(file_path, start_num)
    except ValueError:
        print("Please enter a valid number.")
