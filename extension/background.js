chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
 console.log(message.type)
  if (message.type == "save_and_download") {
    chrome.storage.local.set(
      {
        numInterruptions: message.numInterruptions,
        transcript: message.transcript,
        meetingTitle: message.meetingTitle,
        meetingStartTimeStamp: message.meetingStartTimeStamp
      },
      function () {
        console.log("Saved transcript and meta data, downloading now if non empty")
        if (message.transcript.length > 0)
          top5words()
          downloadTranscript()
      })
  }
  if (message.type == "download") {
    top5words()
    downloadTranscript()
  }
  return true
});

function loadStats(numInterruptions) {
  // testing the open in new page
  // Create a simple HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My HTML Page</title>
</head>
<body>
  <h1>Hello, World! ${numInterruptions}</h1>
  <p>This is a simple HTML page created dynamically.</p>
</body>
</html>
`;

  // Encode the HTML content as a data URL
  const dataUrl = 'data:text/html;base64,' + btoa(htmlContent);

  // Open the data URL in a new tab
  chrome.tabs.create({ url: dataUrl });

}

function downloadTranscript() {
  chrome.storage.local.get(["numInterruptions", "transcript", "meetingTitle", "meetingStartTimeStamp"], function (result) {
    loadStats(result.numInterruptions);
    if (result.transcript) {
      const fileName = result.meetingTitle && result.meetingStartTimeStamp ? `TranscripTonic/Transcript-${result.meetingTitle} at ${result.meetingStartTimeStamp}.txt` : `TranscripTonic/Transcript.txt`

      // Create an array to store lines of the text file
      const lines = [];

      // Iterate through the transcript array and format each entry
      result.transcript.forEach(entry => {
        lines.push(entry.personName);
        lines.push(entry.personTranscript);
        lines.push(''); // Add an empty line between entries
      });

      lines.push("---")
      lines.push("number of interruptions: " + result.numInterruptions)
      lines.push("Transcript saved using TranscripTonic Chrome extension (https://chromewebstore.google.com/detail/ciepnfnceimjehngolkijpnbappkkiag)")


      // Join the lines into a single string
      const textContent = lines.join('\n');

      // Create a Blob from the text content
      const blob = new Blob([textContent], { type: 'text/plain' });

      // Create a download
      // Use Chrome Download API
      chrome.downloads.download({
        url: 'data:text/plain;base64,' + encodeUnicodeString(textContent),
        filename: fileName,
        conflictAction: 'uniquify' // Automatically rename the file if it already exists
      }).then(() => {
        console.log("Transcript downloaded to TranscripTonic directory")
      }).catch((error) => {
        console.log(error)
        chrome.downloads.download({
          url: 'data:text/plain;base64,' + encodeUnicodeString(textContent),
          filename: "TranscripTonic/Transcript.txt",
          conflictAction: 'uniquify' // Automatically rename the file if it already exists
        })
        console.log("Invalid file name. Transcript downloaded to TranscripTonic directory with simple file name.")
      })
    }
    else
      console.log("No transcript found")
  })
}

function top5words() {
    chrome.storage.local.get(["transcript", "meetingTitle", "meetingStartTimeStamp"], function (result) {
        if (result.transcript) {
            const fileName = result.meetingTitle && result.meetingStartTimeStamp ? `TranscripTonic/GoogleMeetTop5-${result.meetingTitle} at ${result.meetingStartTimeStamp}.txt` : `TranscripTonic/Transcript.txt`
            const wordsFrequency = {}
            let textFileLines = []
            let totalWordCounter = 0
            let totalFillerWordCounter = 0
            let timesSpoken = 0
            const fillerWords = ['um', 'like', 'uh', 'yeah', 'umm', 'uhh', 'so', ' ', ',']
            result.transcript.forEach(entry => {
                if (entry.personName == "You") {
                    timesSpoken++
                    let line = entry.personTranscript
                    line = line.replace(/[^\w'\s]+/g, '').toLowerCase()
                    let split_lines = line.split(/\s+/)
                    for (word of split_lines) {
                        symbolsToRemove = [',', '.', '?', '!']
                        symbolsToRemove.forEach(element => {
                            word = word.replace(element, '')
                        });
                        if (word in wordsFrequency) {
                            wordsFrequency[word.toLowerCase()]++
                        } else {
                            wordsFrequency[word.toLowerCase()] = 1
                        }
                        if (fillerWords.includes(word)) {
                            totalFillerWordCounter++
                        }
                        totalWordCounter++
                    }
                }
            })

            // Create items array
            var wordItems = Object.keys(wordsFrequency).map(function(key) {
                return [key, wordsFrequency[key]];
            });
            
            // Sort the array based on the second element
            wordItems.sort(function(first, second) {
                return second[1] - first[1];
            });
            
            // Create a new array with only the first 5 items
            textFileLines.push(`You spoke ${timesSpoken} time${timesSpoken != 1 ? 's' : ''}! Great contribution${timesSpoken != 1 ? 's' : ''}!\n`)

            let fillerWordPercentage = Math.round(100 * totalFillerWordCounter / totalWordCounter)
            textFileLines.push(`You used filler words ${fillerWordPercentage}% of the time.\n`)
            if (totalWordCounter > 10) {
                if (fillerWordPercentage >= 50) {
                    textFileLines.push('Speaking in meetings can be scary. Take a deep breath and remember that these presentations are not the end of the world.\n')
                } else if (fillerWordPercentage >= 25) {
                    textFileLines.push('Good work this meeting. Remember to be confident, people value your opinion!\n')
                } else if (fillerWordPercentage >= 5) {
                    textFileLines.push('You communicate like the average speaker! To make yourself stand out try having notes or preparation beforehand to make yourself stand out!\n')
                } else {
                    textFileLines.push("You're an extremely effective speaker. Please teach us your ways!!\n")
                }
            }
            textFileLines.push('These were your top 5 most used words this meeting!\n')
            for (let i = 0; i < Math.min(wordItems.length, 5); i++) {
                textFileLines.push(`${wordItems[i][0]}: ${wordItems[i][1]}\n`);
            }

            // Join the lines into a single string
            let wordFrequencyText = textFileLines.join('\n')

            // Create a Blob from the text content
            const blob = new Blob([wordFrequencyText], { type: 'text/plain' });
            chrome.downloads.download({
                url: 'data:text/plain;base64,' + encodeUnicodeString(textFileLines),
                filename: fileName,
                conflictAction: 'uniquify' // Automatically rename the file if it already exists
            }).then(() => {
                console.log("Transcript downloaded to TranscripTonic directory")
            }).catch((error) => {
                console.log(error)
                chrome.downloads.download({
                    url: 'data:text/plain;base64,' + encodeUnicodeString(textFileLines),
                    filename: "TranscripTonic/Transcript.txt",
                    conflictAction: 'uniquify' // Automatically rename the file if it already exists
                })
                console.log("Invalid file name. Transcript downloaded to TranscripTonic directory with simple file name.")
            })
        } else {
            console.log("No transcript found")
        }
    })
}

// Thanks to @ifTNT(https://github.com/vivek-nexus/transcriptonic/pull/4)
function encodeUnicodeString(text) {
  const utf8Bytes = new TextEncoder().encode(text)
  const binaryString = String.fromCodePoint(...utf8Bytes);
  return btoa(binaryString);
}
