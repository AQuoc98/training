import json

def remove_invalid_words(data):
    """
    Remove words containing invalid characters from the data list.
    
    Args:
        data: List of dictionaries containing 'text' keys
        
    Returns:
        List of dictionaries with filtered text entries
    """
    invalid_chars = ['-', ',', '_', '*', '/', '\\']
    
    def is_valid_word(text):
        if not text:
            return False
        return not any(char in text for char in invalid_chars)
    
    return [item for item in data if is_valid_word(item.get('text', ''))]

def count_syllables_vietnamese(word):
    parts = word.split()
    return len(parts)

def capitalize_vietnamese(word):
    """
    Capitalize each part of a Vietnamese word.
    
    Args:
        word: String containing Vietnamese word with space-separated parts
        
    Returns:
        String with each part capitalized
    
    Example:
        "nguyen van" -> "Nguyen Van"
    """
    parts = word.split()
    capitalized_parts = [part.capitalize() for part in parts]
    return " ".join(capitalized_parts)  # Use space instead of hyphen

input_file_path = 'words.txt'
output_file_path = 'filtered_output.json'
data_list = []
filtered_data = []

try:
    with open(input_file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
except FileNotFoundError:
    print(f"File not found: {input_file_path}")
    exit()

for line in lines:
    try:
        item = json.loads(line.strip())
        data_list.append(item)
    except json.JSONDecodeError:
        print(f"Error: {line}")
        continue


data_list = remove_invalid_words(data_list)

for item in data_list:
    text = item['text']
    syllable_count = count_syllables_vietnamese(text)
    if syllable_count == 2:
        capitalized_text = capitalize_vietnamese(text)
        new_item = {
            "text": capitalized_text,
            "picked": "false"
        }
        filtered_data.append(new_item)

output_data = {
    "directoryVNData": filtered_data
}

# Export json file
with open(output_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(output_data, json_file, ensure_ascii=False, indent=4)

print(f"Export json file succesfully in: {output_file_path}")