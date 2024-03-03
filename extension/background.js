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
          downloadTranscript()
      })
  }
  if (message.type == "download") {
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

// Thanks to @ifTNT(https://github.com/vivek-nexus/transcriptonic/pull/4)
function encodeUnicodeString(text) {
  const utf8Bytes = new TextEncoder().encode(text)
  const binaryString = String.fromCodePoint(...utf8Bytes);
  return btoa(binaryString);
}
