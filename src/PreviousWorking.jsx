function fetchHA() {
    const ws = new WebSocket(haURL);
    ws.onopen = () => {
      console.log('Sending access token');
      ws.send(JSON.stringify({
        type: 'auth',
        access_token: haToken
      }));
    }
    const retrieve = new Promise((resolve => {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'auth_ok') {
          console.log('Auth OK');
          ws.send(JSON.stringify({
            id: 1,
            type: 'get_states'
          }));
        }
        if (data.id === 1) {
          console.log('Request for states accepted');
          console.log('Set all entities');
          resolve(data.result);
          setAllEntities(data.result);
          console.log('Resolved');
        }
      }
    }))
    retrieve.then(() => {
      ws.send(JSON.stringify({
        id: 18,
        type: 'subscribe_events',
        event_type: 'state_changed'
      }));
      console.log('Sent subscribe request');

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === 18 && data.type === 'event') {
          const matchedEntity = lightCards.some(card => card.entity.entity_id === data.event.data.entity_id);
          console.log(`Message ${data.type} received...Match ? ${matchedEntity}`);
          if (matchedEntity) {
            console.log(`Event entity: ${data.event} pushed to changedEntity: ${changedEntity}`);
            setChangedEntity(data.event);
          }
        }
      }
    })
  }