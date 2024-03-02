window.onload = function () {
  const autoModeRadio = document.querySelector('#auto-mode')
  const manualModeRadio = document.querySelector('#manual-mode')
  const lastMeetingTranscriptLink = document.querySelector("#last-meeting-transcript")
  const lastMeetingSummaryLink = document.querySelector("#last-meeting-summary")

  chrome.storage.sync.get(["operationMode"], function (result) {
    if (result.operationMode == undefined)
      autoModeRadio.checked = true
    else if (result.operationMode == "auto")
      autoModeRadio.checked = true
    else if (result.operationMode == "manual")
      manualModeRadio.checked = true
  })

  autoModeRadio.addEventListener("change", function () {
    chrome.storage.sync.set({ operationMode: "auto" }, function () { })
  })
  manualModeRadio.addEventListener("change", function () {
    chrome.storage.sync.set({ operationMode: "manual" }, function () { })
  })
  lastMeetingTranscriptLink.addEventListener("click", () => {
    chrome.storage.local.get(["transcript"], function (result) {
      if (result.transcript)
        chrome.runtime.sendMessage({ type: "download" }, function (response) {
          console.log(response);
        });
      else
        alert("Couldn't find the last meeting's transcript. May be attend one?")
    })
  })
  lastMeetingSummaryLink.addEventListener("click", () => {
    chrome.storage.local.get(["transcript"], function (result) {
        if (result.transcript) {
            const transcript = result.transcript;
            const apiKey = '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'; // Replace with your actual API key
            const apiEndpoint = 'https://api.openai.com/v1/engines/text-davinci-002/completions';

            // Make API request to OpenAI for summarization
            fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey,
                },
                body: JSON.stringify({
                    model: 'text-davinci-003', // Specify the GPT model
                    prompt: `Summarize the following transcript for a google meet. Do it in bullent point form. Make sure to include any important information: \n${transcript}`,
                    max_tokens: 150, // Adjust the number of tokens for desired summary length
                }),
            })
            .then(response => response.json())
            .then(data => {
                // Handle the response from OpenAI
                const summarizedTranscript = data.choices[0].text.trim();
                // Display the summarized transcript to the user
                alert("Summarized Transcript: " + summarizedTranscript);
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Error summarizing transcript. Please try again later.");
            });
        } else {
            alert("Couldn't find the last meeting's transcript. Maybe attend one?");
        }
    });
});
}