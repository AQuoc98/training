const express = require("express");
const fs = require("fs").promises; // For async file operations
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Function to remove invalid words
const invalidChars = ["-", ",", "_", "*", "/", "\\"];

const isValidWord = (text) => {
  if (!text) return false;
  return !invalidChars.some((char) => text.includes(char));
};

const removeInvalidWords = (data) => {
  return data.filter((text) => isValidWord(text));
};

// Function to remove duplicate texts
const removeDuplicates = (data) => {
  const uniqueTexts = new Set();
  return data.filter((text) => {
    if (uniqueTexts.has(text)) {
      return false;
    }
    uniqueTexts.add(text);
    return true;
  });
};

// Function to count syllables in Vietnamese words
const countSyllablesVietnamese = (word) => {
  const parts = word.split(" ").filter((part) => part); // Remove empty parts
  return parts.length;
};

// Function to lowercase Vietnamese words
const lowercaseVietnamese = (word) => {
  const parts = word.split(" ");
  const lowercaseParts = parts.map((part) => part.toLowerCase());
  return lowercaseParts.join(" ");
};

// API endpoint to process the input file
app.get("/process-words", async (req, res) => {
  const inputFilePath = "words.txt";
  const outputFilePath = "filtered_output.json";
  let dataList = [];
  let filteredData = [];

  try {
    // Read the input file
    const fileContent = await fs.readFile(inputFilePath, "utf-8");
    const lines = fileContent.split("\n").filter((line) => line.trim());

    // Parse each line as JSON
    for (const line of lines) {
      try {
        const parsedItem = JSON.parse(line);
        dataList.push(parsedItem.text);
      } catch (error) {
        console.error(`Error parsing line: ${line}`);
      }
    }

    // Remove invalid words
    dataList = removeInvalidWords(dataList);

    // Remove duplicate words
    dataList = removeDuplicates(dataList);

    // Filter for 2-syllable words and capitalize
    for (const text of dataList) {
      const syllableCount = countSyllablesVietnamese(text);
      if (syllableCount === 2) {
        const lowercasedText = lowercaseVietnamese(text);
        filteredData.push(lowercasedText);
      }
    }

    // Prepare output data
    const outputData = {
      directoryVNData: filteredData,
    };

    // Save to output file
    await fs.writeFile(
      outputFilePath,
      JSON.stringify(outputData, null, 4),
      "utf-8"
    );
    console.log(`Exported JSON file successfully to: ${outputFilePath}`);

    // Send response
    res.json({
      message: "Processing complete",
      data: outputData,
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      res.status(404).json({ error: `File not found: ${inputFilePath}` });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
    console.error(error);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Endpoint to return just an array of text values
app.get("/text-array", async (req, res) => {
  try {
    const outputFilePath = "filtered_output.json";
    const exportFilePath = "text_array.json";
    const fileContent = await fs.readFile(outputFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    
    const textArray = data.directoryVNData;
    
    // Create the export data
    const exportData = {
      count: textArray.length,
      texts: textArray,
    };
    
    // Write to export file
    await fs.writeFile(
      exportFilePath,
      JSON.stringify(exportData, null, 4),
      "utf-8"
    );
    console.log(`Exported text array JSON file successfully to: ${exportFilePath}`);
    
    // Send response
    res.json({
      message: "Text array exported successfully",
      filePath: exportFilePath,
      count: textArray.length,
      texts: textArray,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve text array" });
    console.error(error);
  }
});
