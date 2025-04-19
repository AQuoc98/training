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
  return data.filter((item) => isValidWord(item.text || ""));
};

// Function to remove duplicate texts based on the text property
const removeDuplicates = (data) => {
  const uniqueTexts = new Set();
  return data.filter(item => {
    if (uniqueTexts.has(item.text)) {
      return false;
    }
    uniqueTexts.add(item.text);
    return true;
  });
};

// Function to count syllables in Vietnamese words
const countSyllablesVietnamese = (word) => {
  const parts = word.split(" ").filter((part) => part); // Remove empty parts
  return parts.length;
};

// Function to capitalize Vietnamese words
const capitalizeVietnamese = (word) => {
  const parts = word.split(" ");
  const capitalizedParts = parts.map(
    (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );
  return capitalizedParts.join(" ");
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
        const item = JSON.parse(line);
        dataList.push(item);
      } catch (error) {
        console.error(`Error parsing line: ${line}`);
      }
    }

    // Remove invalid words
    dataList = removeInvalidWords(dataList);

    // Remove duplicate words
    dataList = removeDuplicates(dataList);

    // Filter for 2-syllable words and capitalize
    for (const item of dataList) {
      const text = item.text;
      const syllableCount = countSyllablesVietnamese(text);
      if (syllableCount === 2) {
        const capitalizedText = capitalizeVietnamese(text);
        filteredData.push({
          text: capitalizedText,
          picked: false,
        });
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
    const fileContent = await fs.readFile(outputFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    
    const textArray = data.directoryVNData.map(item => item.text);
    
    res.json({
      count: textArray.length,
      texts: textArray
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve text array" });
    console.error(error);
  }
});
