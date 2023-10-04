function(instance, properties, context) {
    
 // get data
    var token = properties.token;
    var secret = properties.secret;
    var client_id = properties.client_id;
    var model_id = properties.model_id;
    var base_url = context.keys['BASE_URL'];
    
 // check data
    if (!token) {
        instance.publishState('error', "AI Token is empty");
        return;
    }
    
    if (!secret) {
        instance.publishState('error', "Encrypted Secret is empty");
        return;
    }
    
    if (!client_id) {
        instance.publishState('error', "Client ID is empty");
        return;
    }
    
    if (!model_id) {
        instance.publishState('error', "Model ID is empty");
        return;
    }
    
    if (!base_url) {
        instance.publishState('error', "Base URL is empty");
        return;
    }
    
    if (instance.data.n === undefined) {
        instance.data.n = 0;
    }
    
 // fetch request callback
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
    
 // function request AI
    async function requestAI() {
        
     // clear states
        instance.publishState('content', '');
        instance.publishState('error', '');
        
        instance.data.content = ''
        
        try {
            
            var url = `https://ai-finetuner-v1.ops-ef0.workers.dev`;
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify({
                    token: token,
                    client: client_id,
                    secret: secret,
                    model: model_id,
                    base: base_url
                })
            }).then(response => {
                
             // check if the response is ok
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                
             // get the reader from the response's body.
                const reader = response.body.getReader();
                
             // function to handle the chunks
                function handleChunk({ done, value }) {
                    if (done) {
                        console.log('Stream complete');
                        return;
                    }
                    const decodedChunk = new TextDecoder("utf-8").decode(new Uint8Array(value));
                    instance.data.content = instance.data.content + decodedChunk;
                    instance.publishState('content', instance.data.content)
                    reader.read().then(handleChunk);
                }
                
             // start reading the chunks
                reader.read().then(handleChunk);
                
            }).catch(error => {
                console.error('Fetch error:', error);
            });
            
        } catch (error) {
            
         // publish states and trigger event
            instance.publishState('error', JSON.stringify(error));
            instance.publishState('streaming', false);
            instance.triggerEvent('error')
            
            console.error("Error:", error);
            
        }
        
        return;
    }
    
}