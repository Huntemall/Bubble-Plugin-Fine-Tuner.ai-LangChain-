function(instance, properties, context) {
  if(!context.keys.CLIENT_ID) {
      instance.publishState('error', "CLIENT_ID is empty");
      return;
  }
    
  if(!properties.token) {
      instance.publishState('error', "Token is empty");
      return;
  }

  if (instance.data.n === undefined) {
	instance.data.n = 0;
  }
    const fetch_data = async (cb) => {
        try {
            await requestAI();
            cb(null, '');
        } catch (e) {
            cb(e);
        }
    };

    fetch_data.toString = () => {
        return instance.data.n;
    };

    const value = context.async(fetch_data);

    instance.data.n++;

	async function requestAI() {
        instance.publishState('content', '');
	    instance.publishState('error', '');
        
        instance.data.content = ''
        
        try {
            
			var url = `https://ai-finetuner.motsab4146cu.workers.dev/ai/?client_id=${context.keys.CLIENT_ID}`;
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: properties.token
            }).then(response => {
              // Check if the response is ok.
              if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
              }

              // Get the reader from the response's body.
              const reader = response.body.getReader();

              // Function to handle each chunk.
              function handleChunk({ done, value }) {
                // If the stream is done, return.
                if (done) {
                  console.log('Stream complete');
                  return;
                }

                // Log the chunk (or process it in some way).
                const decodedChunk = new TextDecoder("utf-8").decode(new Uint8Array(value));
                  
                instance.data.content = instance.data.content + decodedChunk
                  
                instance.publishState('content', instance.data.content)

                // Read the next chunk.
                reader.read().then(handleChunk);
              }

              // Start reading the chunks.
              reader.read().then(handleChunk);
            }).catch(error => {
              console.error('Fetch error:', error);
            });
            
        } catch (error) {
              
            instance.publishState('error', JSON.stringify(error));
            instance.publishState('streaming', false);
            instance.triggerEvent('error')
            console.error("Error:", error);
              
        }
        
        return;
    }

}