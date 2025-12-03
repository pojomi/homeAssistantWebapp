import { Fragment, useState, useRef, useEffect, useMemo } from 'react';
import Icon from '@mdi/react';
import './App.css';
import { enableDragDropTouch } from '@dragdroptouch/drag-drop-touch';
import {
  mdiMagnify,
  mdiLightbulbOnOutline,
  mdiLightbulbOffOutline,
  mdiPowerPlugOutline,
  mdiPowerPlugOffOutline,
  mdiDoorClosed,
  mdiDoorOpen,
  mdiFan,
  mdiFanOff,
  mdiAirConditioner,
  mdiAirHumidifier,
  mdiAirHumidifierOff,
  mdiFloppy,
  mdiLockOutline,
  mdiLockOffOutline,
  mdiTrashCan,
  mdiThermometer,
  mdiWaterPercent,
  mdiMotionSensorOff,
  mdiMotionSensor
} from '@mdi/js';

enableDragDropTouch();

const haToken = import.meta.env.VITE_HA_TOKEN;
const haURL = 'wss://prvokqi6answv8fyvaknnv2wbqr5fmzl.ui.nabu.casa/api/websocket';

const ws = new WebSocket(haURL);
  ws.onopen = () => {
    console.log('Sending access token');
    ws.send(JSON.stringify({
      type: 'auth',
      access_token: haToken
    }));
  }



function App() {
  // Hooks
  const createRef = useRef(null);
  const createDivRef = useRef(null);
  const calendarRef = useRef(null);
  const fanIconRef = useRef(null);
  const lightCardDiv = useRef(null);
  const searchBar = useRef(null);
  const nameRef = useRef(null);
  const lightsRef = useRef(null);
  const sensorsRef = useRef(null);
  const dragTarget = useRef(null);
  const draggedOverTarget = useRef(null);
  const fanSpeedContainerRef = useRef(null);
  const fanSpeedRef = useRef(null);
  const [allEntities, setAllEntities] = useState([]);
  const [changedEntity, setChangedEntity] = useState();
  const [fanObjects, setFanObjects] = useState([]);
  const [fans, setFans] = useState([]);
  const [fanSpeedWidth, setFanSpeedWidth] = useState('0px');
  const [isCardNew, setIsCardNew] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  const [isLightVisible, setIsLightVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSensorVisible, setIsSensorVisible] = useState(false);
  const [lights, setLights] = useState([]);
  const [lightCards, setLightCards] = useState([]); // Store created light cards
  const [lightMaxHeight, setLightMaxHeight] = useState('0px');
  const [matches, setMatches] = useState([{}]);
  const [newSensor, setNewSensor] = useState(false);
  const [opacity, setOpacity] = useState('0');
  const [outlets, setOutlets] = useState([]);
  const [newFan, setNewFan] = useState(false);
  const [newOutlet, setNewOutlet] = useState(false);
  const [outletObjects, setOutletObjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [sensorMaxHeight, setSensorMaxHeight] = useState('0px');
  const [sensorObjects, setSensorObjects] = useState([]); // Store created sensor objects
  const [serviceSocketId, setServiceSocketID] = useState(24);
  const [showFans, setShowFans] = useState(false);
  const [showOutlets, setShowOutlets] = useState(false);
  const [thermostat, setThermostat] = useState({})
  const [tstatCard, setTstatCard] = useState(false);
  const lightCardsAdj = [...lightCards];
  const idCheck = serviceSocketId;
  
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
          setAllEntities(data.result);
          console.log('Set all entities');
          if (fans.length === 0) {
            const parsedFans = data.result.filter(entity => entity.entity_id.startsWith('fan.'));
            setFans(parsedFans);
          }
          if (outlets.length === 0) {
            const switches = data.result.filter(entity => entity.entity_id.startsWith('switch.'));
            const parsedOutlets = switches.filter(entity => entity.attributes.device_class === 'outlet');
            setOutlets(parsedOutlets);
            console.log('outlets set in ws.onmessage');
          }
          if (lights.length === 0) {
            const lightEntities = data.result.filter(entity => entity.entity_id.startsWith('light.'));
            setLights(lightEntities);
            console.log('lights set in ws.onmessage');
          }
          if (sensors.length === 0) {
            // const sensorEntities = data.result.filter(entity => entity.entity_id.startsWith('sensor.') || entity.entity_id.startsWith('binary_sensor.') && entity.entity_id.includes('door') || entity.entity_id.includes('presence'));
            const sensorEntities = data.result.filter(entity => (entity.entity_id.startsWith('sensor') || 
              entity.entity_id.startsWith('binary_sensor')) && entity.attributes.device_class 
              && (entity.attributes.device_class === 'humidity' || entity.attributes.device_class === 'occupancy' 
              || entity.attributes.device_class === 'temperature' || entity.attributes.device_class === 'door'));
            setSensors(sensorEntities);
            console.log('sensors set in ws.onmessage');
          }
          ws.send(JSON.stringify({
            id: 18,
            type: 'subscribe_events',
            event_type: 'state_changed'
          }));
          console.log('Sent subscribe request');
          // Updates states of entities on page load
          if (lightCards.length > 0) {
            lightCards.map(card => {
              if (data.result.find(entity => {
                if (entity.entity_id === card.entity?.entity_id) {
                  card.entity.state = entity.state;
                  card.entity.attributes = entity.attributes;
                }
                card.sensor.map(s => {
                  if (s.entity.entity_id === entity.entity_id) {
                    s.entity.state = entity.state;
                  }
                })
                card.outlet && card.outlet.map(o => {
                  if (o.entity.entity_id === entity.entity_id) {
                    o.entity.state = entity.state;
                  }
                })
                card.fan && card.fan.map(f => {
                  if (f.entity.entity_id === entity.entity_id) {
                    f.entity.state = entity.state;
                    f.entity.attributes.percentage = entity.attributes.percentage;
                    setFanSpeedWidth(`${Math.round((entity.attributes.percentage / 100) * 210)}px`);
                  }
                })
              }));
            });
          };
          if (tstatCard) {
            data.result.find(entity => {
              if (entity.entity_id === thermostat.entity_id) {
                thermostat.attributes.temperature = entity.attributes.temperature;
                thermostat.attributes.current_temperature = entity.attributes.current_temperature;
                thermostat.attributes.hvac_action = entity.attributes.hvac_action;
              }
            })
          }
          // Send first ping
          setTimeout(() => {ws.send(JSON.stringify({
            id: 19,
            type: 'ping'
            }));
          }, 30000);
        };
        if (data.id === 18) {
          if (lightCards.some(card => card.entity.entity_id === data.event?.data.entity_id || card.sensor.some(s => s.entity.entity_id === data.event?.data.entity_id))) {
            setChangedEntity(data.event);
          }
          if (lightCards.some(card => card.entity && card.entity.entity_id === data.event?.data.entity_id || card.outlet && card.outlet.some(o => o.entity.entity_id === data.event?.data.entity_id))) {
            setChangedEntity(data.event);
          }
          if (lightCards.some(card => card.fan && card.fan.some(f => f.entity.entity_id === data.event?.data.entity_id))) {
            setChangedEntity(data.event);
          }
          if (thermostat.entity_id === data.event?.data.entity_id) {
            setChangedEntity(data.event);
          }
        }
        // Ping and pong every 30s to keep socket open
        if (data.id === 19) {
          setTimeout(() => {ws.send(JSON.stringify({
            id: 19,
            type: 'ping'
            }));
          }, 30000);
        }
        if (data.id === serviceSocketId) {
        }
  }
  
  ws.onclose = () => {
    console.log(`Socket closed`);
  }

  // Load stored light cards
  useEffect(() => {
    if (localStorage.cards) {
      if (lightCards.length === 0) {
        const storedLightCards = JSON.parse(localStorage.getItem('cards'));
        setLightCards(storedLightCards);
      }
    }
    if (lights.length === 0 && localStorage.lights) {
      const storedLights = JSON.parse(localStorage.getItem('lights'));
      setLights(storedLights);
      console.log(storedLights); 
    }
    if (sensors.length === 0 && localStorage.sensors) {
      const storedSensors = JSON.parse(localStorage.getItem('sensors'));
      setSensors(storedSensors);
    }
    if (localStorage.thermostat) {
      const parsedTstat = JSON.parse(localStorage.getItem('thermostat'));
      setThermostat(parsedTstat);
      setTstatCard(true);
    }
    if (outlets.length === 0 && localStorage.outlets) {
      const storedOutlets = JSON.parse(localStorage.getItem('outlets'));
      setOutlets(storedOutlets);
    }
  }, []);
    
  // Locally store list of lights
  useEffect(() => {
    if (lights.length > 0) {
      localStorage.setItem('lights', JSON.stringify(lights));
    }
  }, [lights]);

  // Locally store list of sensors
  useEffect(() => {
    if (sensors.length > 0) {
      localStorage.setItem('sensors', JSON.stringify(sensors));
    }
  }, [sensors]);

  // Locally store list of outlets
  useEffect(() => {
    if (outlets.length > 0) {
      localStorage.setItem('outlets', JSON.stringify(outlets));
    }
  }, [outlets]);

  useEffect(() => {
    if (fans.length > 0) {
      localStorage.setItem('fans', JSON.stringify(fans));
    }
  }, [fans]);


  // Toggle visibility of .entityContainer when '+' button is clicked
  const createMenu = () => {
    if (isMenuVisible === false) {
      // if (allEntities.length === 0) {fetchHA()};
      setIsCardNew(false);
      setIsMenuVisible(true);
      setTimeout(() => setOpacity('1'), 10);
      calendarRef.current.style.opacity = '0';
      setTimeout(() => calendarRef.current.style.display = 'none', 310);
    }
    if (isMenuVisible === true) {
      setOpacity('0');
      setIsSearching(false);
      setMatches([]);
      setLightMaxHeight('0px');
      setSensorMaxHeight('0px');
      setNewSensor(false);
      searchBar.current.value = 'Search';
      setTimeout(() => {
        setIsMenuVisible(false);
        setIsLightVisible(false);
        setIsSensorVisible(false);
        calendarRef.current.style.display = 'grid';
      }, 300);
      setTimeout(() => calendarRef.current.style.opacity = '1', 310);
    }
  }

  function getOutlets() {
    showOutlets && setShowOutlets(false);
    !showOutlets && setShowOutlets(true);
  }

function createOutletObject(e) {
  if (e.target.id.includes('switch.')) {
    const clickedEntity = e.target.id;
    // Remove the clicked outlet entity from the list
    const updatedOutletsList = outlets.filter(o => o.entity_id !== clickedEntity);
    setOutlets(updatedOutletsList);
    localStorage.setItem('outlets', JSON.stringify(updatedOutletsList));
    const haEntity = allEntities.find(entity => entity.entity_id === clickedEntity);
    setNewOutlet(true);
    if (haEntity) {
      // Add the new sensor object to the array
      setOutletObjects([...outletObjects, { id: clickedEntity, entity: haEntity }]);
      setSelected(clickedEntity);
    }
  }
  setShowOutlets(false);
}
  
  function OutletList() {
    if (outlets.length > 0 && showOutlets === true) {
      return (
        outlets.map(o => (
          <button type='button' 
            key={o.entity_id} 
            className='entitySelection'
            id={o.entity_id} 
            style={{
              appearance: 'none', 
              backgroundColor: '#2c2c2c50', 
              fontWeight: 'bold',
              color: 'white'
            }}
            onClick={createOutletObject}
            >
            {o.attributes.friendly_name ? o.attributes.friendly_name : o.entity_id}
          </button>
        ))
      )
    }
  }

function getFans() {
  showFans ? setShowFans(false) : setShowFans(true);
}
function createFanObject(e) {
  if (e.target.id.includes('fan.')) {
    const clickedEntity = e.target.id;
    // Remove the clicked fan entity from the list
    const updatedFanList = fans.filter(f => f.entity_id !== clickedEntity);
    const haEntity = allEntities.find(entity => entity.entity_id === clickedEntity);
    setFans(updatedFanList);
    setNewFan(true);
    localStorage.setItem('fans', JSON.stringify(updatedFanList));
    setFanObjects([...fanObjects, { id: clickedEntity, entity: haEntity }]);
    setSelected(clickedEntity);
  }
  setShowFans(false);
}
  
function FanList() {
  if (fans.length > 0 && showFans) {
  return (
    fans.map(f => (
      <button type='button' className='entitySelection' id={f.entity_id} 
        key={f.entity_id} 
        onClick={createFanObject}>
          {f.attributes.friendly_name ? f.attributes.friendly_name : f.entity_id}
      </button>
    ))
  )}
}
  
function OutletCards({ entity_id, state }) {

  function outletToggle(e) {
    if (state === 'on') {
      ws.send(JSON.stringify({
        id: serviceSocketId,
        type: 'call_service',
        domain: 'switch',
        service: 'turn_off',
        target: {
          entity_id: `${entity_id}`
        }
      }))
      console.log(`sent switch.turn_off to ${entity_id}`);
    }
    if (state === 'off') {
      ws.send(JSON.stringify({
        id: serviceSocketId,
        type: 'call_service',
        domain: 'switch',
        service: 'turn_on',
        target: {
          entity_id: `${entity_id}`
        }
      }))
      console.log(`sent switch.toggle to ${entity_id}... state? ${state}`);
    }
    setServiceSocketID(idCheck + 1);
  }
  return (
    <div className='outletCard' id={`${entity_id}Div`} key={`${entity_id}DivKey`}>
      <button type='button' id={entity_id} 
        key={`${entity_id}Button`}
        onClick={outletToggle}

      >
        <span id='outletIcon' key={`${entity_id}Span`}>
          <Icon 
            path={state === 'on' ? mdiPowerPlugOutline : mdiPowerPlugOffOutline} 
            size={1} className='mdiPowerPlugOutline'
            key={`${entity_id}Icon`}
          />
        </span>
      </button>
    </div>
  )
}

  // Function to retrieve and display list of Home Assistant light entities
  const getLights = () => {  
    if (isLightVisible === false) {
      setTimeout(() => setSensorMaxHeight('0px'), 10);
      setTimeout(() => setIsSensorVisible(false), 310);
      setTimeout(() => setIsLightVisible(true), 10);
      setTimeout(() => setLightMaxHeight('175px'), 310);
    }
    if (isLightVisible === true && isSensorVisible === false) {
      setTimeout(() => {
        setLightMaxHeight('0px');
      }, 10);
      setTimeout(() => setIsLightVisible(false), 310);
    }
  };

  const LightList = () => {
    if (isSearching === false && isLightVisible) {
      return (
        lights.map(light => (
          <button
            onClick={CreateLightCard}
            key={light.entity_id}
            type='button'
            id={light.entity_id}
            style={{
              appearance: 'none', 
              backgroundColor: '#2c2c2c50', 
              fontWeight: 'bold',
              color: 'white'
            }}
            >
            {light.attributes.friendly_name ? light.attributes.friendly_name : light.entity_id}
          </button>
        ))
      )
    }
  }

  const lookupSearch = (e) => {
    setIsSearching(true);
    setLightMaxHeight('175px');
    setSensorMaxHeight('175px');
    const searchVal = e.target.value;
    const searchList = { 'lights':[], 'sensors':[]};
    searchList.lights = lights.filter(light => 
      light.attributes.friendly_name.toLowerCase().includes(searchVal.toLowerCase()));
    searchList.sensors = sensors.filter(sensor =>
      sensor.entity_id.toLowerCase().includes(searchVal.toLowerCase()));
    setMatches(searchList);
  }

  const SearchResultsLights = () => {
    if (isSearching === true) {
      if (matches.lights) {
        return (
          matches.lights.map(light => (
            <button
                onClick={CreateLightCard}
                key={light.entity_id}
                type='button'
                id={light.entity_id}
                style={{
                  appearance: 'none', 
                  backgroundColor: '#2c2c2c50', 
                  fontWeight: 'bold',
                  color: 'white'
                }}
                >
                {light.attributes.friendly_name ? light.attributes.friendly_name : light.entity_id}
              </button>
          ))
      )}
  }}

  const SearchResultsSensors = () => {
    if (isSearching === true) {
      if (matches.sensors) {
          return (
            matches.sensors.map(sensor => (
              <button
                key={sensor.entity_id}
                type='button'
                id={sensor.entity_id}
                style={{
                  appearance: 'none',
                  backgroundColor: '#2c2c2c50',
                  fontWeight: 'bold',
                  color: 'white'
                }}
                onClick={CreateSensorObject}
                >
                  {sensor.attributes.friendly_name ? sensor.attributes.friendly_name : sensor.entity_id}
                </button>
            ))
          )
        }
    }
  }

  // Function to retrieve and display list of Home Assistant sensor entities
  const getSensors = () => {
    if (isSensorVisible === false) {
      setTimeout(() => setLightMaxHeight('0px'), 10);
      setTimeout(() => setIsLightVisible(false), 310);
      setIsSensorVisible(true);
      setTimeout(() => setSensorMaxHeight('175px'), 310);
    }
    if (isSensorVisible === true && isLightVisible === false) {
      setTimeout(() => {
        setSensorMaxHeight('0px');
      }, 10);
      setTimeout(() => setIsSensorVisible(false), 310);
    }
  }

  const SensorList = () => {
    if (isSearching === false && isSensorVisible) {
      return (
        sensors.map(sensor => (
          <button
            key={sensor.entity_id}
            type='button'
            id={sensor.entity_id}
            style={{
              appearance: 'none',
              backgroundColor: '#2c2c2c50',
              fontWeight: 'bold',
              color: 'white'
            }}
            onClick={CreateSensorObject}
          >
          {sensor.attributes.friendly_name && sensor.attributes.friendly_name}
          <br />
          {sensor.entity_id}
          </button>
        ))
      )
    }
  }

  // When an entity is selected, add it to [lightCards]
  const CreateLightCard = (e) => {
    const clickedEntity = e.target.id;
    if (clickedEntity.includes('light.')) {
      const clickedLight = lights.find(light => light.entity_id === clickedEntity);
      // Remove the clicked light entity from the list
      const updatedLightsList = lights.filter(light => light.entity_id != clickedEntity);
      setLights(updatedLightsList);
      localStorage.setItem('lights', lights);
      const haEntity = allEntities.find(entity => entity.entity_id === clickedEntity);
      setIsLightVisible(false);
      setLightMaxHeight('0px');
      
      if (haEntity) {
        // Add the new light card to the array
        setLightCards([...lightCards, { id: clickedEntity, entity: haEntity, sensor: [] }]);
        setSelected(clickedEntity);
        setIsCardNew(true);
      }
      setIsSearching(false);
      setMatches([]);
      searchBar.current.value = 'Search';
    }
  }

  function CreateSensorObject(e) {
    if (e.target.id.includes('sensor.' || 'binary_sensor')) {
      const clickedEntity = e.target.id;
      // Remove the clicked sensor entity from the list
      const updatedSensorsList = sensors.filter(sensor => sensor.entity_id != clickedEntity);
      setSensors(updatedSensorsList);
      localStorage.setItem('sensors', sensors);
      const haEntity = allEntities.find(entity => entity.entity_id === clickedEntity);
      setIsSensorVisible(false);
      setNewSensor(true);
      setSensorMaxHeight('0px');
      if (haEntity) {
        // Add the new sensor object to the array
        setSensorObjects([...sensorObjects, { id: clickedEntity, entity: haEntity }]);
        setSelected(clickedEntity);
      }
      setIsSearching(false);
      setMatches([]);
      searchBar.current.value = 'Search';
    }
  }
  
  const setParent = (e) => {
    const parentCard = lightCards.find(card => card.entity.entity_id === e.target.id);
    
    if (newFan) {
      const fanObj = fanObjects.find(fan => fan.id === selected);
      parentCard.fan ? null : parentCard.fan = [];
      parentCard.fan.push(fanObj);
      setNewFan(false);
      setOpacity('0');
      setTimeout(() => {
        localStorage.setItem('cards', JSON.stringify(lightCards));
        setIsMenuVisible(false);
        calendarRef.current.style.opacity = '1';
        calendarRef.current.style.display = 'grid';
      }, 300);
    }

    if (newOutlet) {
      const outletObj = outletObjects.find(outlet => outlet.id === selected);
      parentCard.outlet ? null : parentCard.outlet = [];
      parentCard.outlet.push(outletObj);
      console.log('current lightCards: ', lightCards);
      setNewOutlet(false);
      setOpacity('0');
      setTimeout(() => {
        localStorage.setItem('cards', JSON.stringify(lightCards));
        setIsMenuVisible(false);
        calendarRef.current.style.opacity = '1';
        calendarRef.current.style.display = 'grid';
      }, 300);
    }

    if (newSensor) {
      const sensorObj = sensorObjects.find(sensor => sensor.id === selected);
      parentCard.sensor ? null : parentCard.sensor = [{}];
      parentCard.sensor.push(sensorObj);
      console.log('current lightCards: ', lightCards);
      setNewSensor(false);
      // Close the menu
      setOpacity('0');
      setTimeout(() => { 
          localStorage.setItem('cards', JSON.stringify(lightCards));
          setIsLightVisible(false);
          setIsSensorVisible(false);
          setIsMenuVisible(false);
          calendarRef.current.style.opacity = '1';
          calendarRef.current.style.display = 'grid';
        }, 300);
    }
    }
  

  
  function SelectParentCard() {
    return (
      <div className='newCardNameDiv' id='selectParent' style={{display: newSensor || newOutlet || newFan ? 'flex' : 'none'}}>
        <span id='makeSelection'>Assign to card:</span>
        {lightCards.map(card => (
          <button type='button' key={card.entity.entity_id} className='cardSelection' id={card.entity.entity_id} onClick={setParent}>{card.id}</button>
        ))}
      </div>
    )
  }
  
  
  // Display the name card div when an entity is selected from the list
  function NameCard() {
    return (
      <div className='newCardNameDiv' style={{display: isCardNew ? 'flex' : 'none'}}>
            <input ref={nameRef} type='text' id='newCardNameInput' defaultValue='Enter name for card'
            onFocus={(e) => e.target.select()} onKeyUp={saveNewCardName} />
            <button type='button' id='saveCardName' onClick={saveNewCardName}>Save</button>
      </div>
    )
  }

  // Handle naming new card
  function saveNewCardName(e) {
    if (e.type === 'keyup' && e.key === 'Enter' || e.type === 'click') {
      const targetCard = lightCards.find(card => card.id === selected);
      targetCard.id = nameRef.current.value;
      setIsCardNew(false);
      // Close the menu
      setOpacity('0');
      setTimeout(() => {
          localStorage.setItem('cards', JSON.stringify(lightCards));
          setIsLightVisible(false);
          setIsSensorVisible(false);
          setIsMenuVisible(false);
          calendarRef.current.style.opacity = '1';
          calendarRef.current.style.display = 'grid';
        }, 300);
    }
  }
  
  // Handle deleting card
  const deleteCard = (e) => {
    const deletedCard = lightCards.find(card => card.entity.entity_id === e.target.id);
    if (deletedCard.sensor.length > 0) {
      deletedCard.sensor.map(s => {sensors.push(s.entity); console.log('pushed: ', s.entity)})
      localStorage.setItem('sensors', JSON.stringify(sensors));
    }

    const remainingCards = lightCards.filter(card => card.entity.entity_id !== e.target.id);
    // setLightCards(lightCards.filter(card => card.entity.entity_id !== e.target.id));
    localStorage.setItem('cards', JSON.stringify(remainingCards));
    if (deletedCard) {
      setLightCards(remainingCards);
      setLights([...lights, deletedCard.entity]);
      setIsCardNew(false);
      setIsSearching(false);
    }
  }

  // Gets dragged card and hides drag image
  const dragCard = (e) => {
    e.target.style.cursor = isDraggable ? 'move' : 'default';
    const img = new Image(0, 0);
    dragTarget.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(img, 0, 0);
  }
    
  // Handles swapping the display of cards when dragged around  
  const swapCard = (e) => {
    e.preventDefault();
    // const draggingCard = lightCards.find(card => card.entity.entity_id === dragTarget.current.id);
    let draggingIndex = lightCardsAdj.findIndex(dragging => dragging.entity.entity_id === dragTarget.current.id);
    if (!dragTarget.current) {return console.log('no drag target yet')};
    draggedOverTarget.current = e.currentTarget;
    if (draggedOverTarget.current === dragTarget.current) return;
    const draggedOverCard = lightCards.find(card => card.entity.entity_id === draggedOverTarget.current.id);
    const originDragOverIndex = lightCardsAdj.findIndex(dragged => dragged.entity.entity_id === draggedOverTarget.current.id); 

    function controlCardSwap(arr, index1, index2) {
      let tempCard = arr[index1];
      arr[index1] = arr[index2];
      arr[index2] = tempCard;
      setLightCards(arr);
    }
    
    controlCardSwap(lightCardsAdj, draggingIndex, originDragOverIndex);
  }

  // Toggles card if cards are draggable
  function toggleDrag(e) {
    isDraggable ? setIsDraggable(false) : setIsDraggable(true);
  }


  function getThermostat() {
    if (allEntities) {
      const tstat = allEntities.find(entity => entity.entity_id.startsWith('climate.'));
      setThermostat(tstat);
      setTstatCard(true);
      localStorage.setItem('thermostat', JSON.stringify(tstat));
      console.log(tstat);
    }
  }
  
  function ThermostatCard() {
    
  
    function setTemp(e) {
      if (e.target.id === 'tempUp' || e.target.id === 'tempDown') {
        const increment = e.target.id === 'tempUp' ? 1 : -1;
        if (thermostat.attributes) {
          ws.send(JSON.stringify({
            id: serviceSocketId,
            type: 'call_service',
            domain: 'climate',
            service: 'set_temperature',
            service_data: {
              temperature: Math.round(thermostat.attributes.temperature + increment)
            },
            target: {
              entity_id: thermostat.entity_id
            }
          }))
          console.log('Button clicked, temperature changed to: ', Math.round(thermostat.attributes.temperature - increment));
        }
      }
      setServiceSocketID(idCheck + 1);
    }


    if (thermostat && tstatCard) {
      return (
        <div className='thermostatCard' style={{
          boxShadow: thermostat.attributes?.hvac_action === 'heating' ? 'inset 2px 2px 5px orange, -2px -2px 5px inset orange ,inset 3px 3px 20px red' : 'inset 2px 2px 2px hsla(0, 0%, 100%, 0.6)'
        }}>
          <div className='header'>
            <span>
              Thermostat
            </span>
          </div>
          <div className='thermostatControl'>
            <button id='tempDown' onClick={setTemp}>
              -
            </button>
            <span id='currentTemp' style={{color: thermostat.attributes?.hvac_action === 'heating' ? 'orange' : 'white'}}>
              {thermostat.attributes?.current_temperature}
            </span>
            <span id='setTemp'>
              {thermostat.attributes?.temperature}
            </span>
            <button id='tempUp' onClick={setTemp}>
              +
            </button>
          </div>
        </div>
      )
   }
  }

  // Light Card Component
  function LightCard({ entity, entityName, entityRGB, card, children }) {
    const inputRef = useRef(null);
    const [brightness, setBrightness] = useState(
      entity.attributes.brightness !== inputRef.current?.value
        ? Math.round((entity.attributes.brightness / 255) * 100) 
        : inputRef.current?.value
    );
    
    const [icon, setIcon] = useState(
      entity.state === 'on' ? mdiLightbulbOnOutline : mdiLightbulbOffOutline
    );
    
    const fillRef = useRef(null);
    const tooltipRef = useRef(null);

    const setBrightnessDrag = (e) => {
      const newBrightness = e.target.value;
      tooltipRef.current.style.display = 'flex';
      setBrightness(newBrightness);
    }
    const sendBrightness = (e) => {
      hideTooltip();
      const slideValue = Math.round((e.target.value / 100) * 255);
      entity.attributes.brightness = slideValue;

      ws.send(JSON.stringify({
        id: serviceSocketId,
        type: 'call_service',
        domain: 'light',
        service: 'turn_on',
        service_data: {
          brightness: slideValue
        },
        target: {
          entity_id: `${entity.entity_id}`
        }
      }))

      setServiceSocketID(idCheck + 1);
    }

    const hideTooltip = () => {
      tooltipRef.current.style.display = 'none';
    }

    


    function lightToggle() {
      if (entity.state === 'on') {
        ws.send(JSON.stringify({
          id: serviceSocketId,
          type: 'call_service',
          domain: 'light',
          service: 'turn_off',
          target: {
            entity_id: `${entity.entity_id}`
          }
        }))
      }
      console.log(`sent light.turn_off to ${entity.entity_id}`);
      
      if (entity.state === 'off') {
        ws.send(JSON.stringify({
          id: serviceSocketId,
          type: 'call_service',
          domain: 'light',
          service: 'turn_on',
          target: {
            entity_id: `${entity.entity_id}`
          }
        }))
        console.log(`sent light.turn_on to ${entity.entity_id}`);
      }
      setServiceSocketID(idCheck + 1);
    }

    
    

    const [isTitleVisible, setIsTitleVisible] = useState(true);
    const cardTitle = useRef(null);

    return (
      <div className='lightCardContainer'>
        <div 
          ref={lightCardDiv}
          className="lightCard"
          id={entity.entity_id}
          draggable={isDraggable}
          onDragStart={dragCard}
          onDragOver={swapCard}
          onDrop={toggleDrag}
          style={{
          height: 'auto',
          cursor: isDraggable ? 'move' : 'default',
          opacity: isDraggable ? '0.6' : '0.8',
          border: isDraggable ? '4px dashed black' : 'none',
          boxShadow: 'inset 2px 2px 2px hsla(0, 0%, 100%, 0.6)'
          }}>
          <div className='editContainer' id={entity.entity_id}>
            <button type='button' className='deleteButton' id={entity.entity_id} onClick={deleteCard} style={{
              display: isDraggable ? 'block' : 'none'
            }}>X</button>
            <span ref={cardTitle} className='cardTitle' id={entity.entity_id}
            style={{display: isTitleVisible ? 'grid' : 'none'}}>{entityName}</span>
            <div className='sensorObject' style={{display: card.sensor.length > 0 ? 'block' : 'none' }}>
            {card.sensor.map(sensorInd => (
              sensorInd.entity && sensorInd.entity.entity_id.startsWith('sensor.') &&
              <span className='sensorAttributes' key={sensorInd.id}>
                <Icon path={sensorInd.entity.attributes.device_class === 'temperature' ? mdiThermometer 
                  : sensorInd.entity.attributes.device_class === 'humidity' ? mdiWaterPercent 
                  : null} 
                  size={1} 
                  className='mdiSensorIcon' 
                  key={sensorInd.entity.entity_id} 
                  style={{
                    display: sensorInd.entity.attributes.device_class !== 'temperature' ? 
                    sensorInd.entity.attributes.device_class !== 'humidity' ? 
                    'none' : '' : ''
                    }}
                    />
                {sensorInd.entity ? ' ' + Math.round(sensorInd.entity.state) + sensorInd.entity.attributes.unit_of_measurement : null}
              </span>      
            ))}
            {card.sensor.map(sensorInd => (
              sensorInd.entity && sensorInd.entity.entity_id.startsWith('binary_sensor.') &&
              sensorInd.entity.entity_id.includes('door') &&
              <span className='sensorAttributes' key={sensorInd.id}>
                <Icon path={sensorInd.entity.state === 'off' ? mdiDoorClosed 
                  : sensorInd.entity.state === 'on' ? mdiDoorOpen 
                  : null} 
                  size={1} 
                  className='mdiSensorIcon' 
                  key={sensorInd.entity.entity_id}
                />
              </span>      
            ))}
            {card.sensor.map(sensorInd => (
              sensorInd.entity && sensorInd.entity.entity_id.startsWith('binary_sensor.') && 
              sensorInd.entity.entity_id.includes('presence') &&
              <span className='sensorAttributes' key={sensorInd.id}>
                <Icon path={sensorInd.entity.state === 'off' ? mdiMotionSensorOff
                  : sensorInd.entity.state === 'on' ? mdiMotionSensor
                  : null}
                  size={1}
                  className='mdiSensorIcon'
                  key={sensorInd.entity.entity_id}
                />
              </span>
            ))}
            </div>
          </div> 
          

          <div className='lightControlContainer' id={entity.entity_id}
            style={{cursor: isDraggable ? 'move' : 'default'}}>
              <button type="button" className="lightButton" id={entity.entity_id}
              onClick={lightToggle}
              disabled={isDraggable}
              style={{cursor: isDraggable ? 'move' : 'default'}}>
                <Icon path={icon} size={1} className='mdiLightbulbOutline'/>
              </button>
              <div className='brightnessSliderContainer' id={entity.entity_id}
              style={{
                cursor: isDraggable ? 'move' : 'default',
                display: entity.attributes.brightness === undefined ? 'none' : 'flex'
              }}>
                <div ref={fillRef} className='brightnessFill' id={entity.entity_id}
                  style={{
                    backgroundColor: entityRGB ? `rgb(${entityRGB})` : 'white',
                    opacity: entity.state === 'on' ? '1' : '0', 
                    width: `${brightness}%`,
                    transition: 'width 0.2s ease, opacity 0.2s ease',
                    cursor: isDraggable ? 'move' : 'default'
                  }}>
                  <input 
                    id={entity.entity_id}
                    type="range" 
                    className='brightnessSlider' 
                    ref={inputRef}
                    min="5" 
                    max="100" 
                    value={brightness} 
                    step="5" 
                    style={{margin: '0', cursor: isDraggable ? 'move' : 'default'}}
                    disabled={isDraggable}
                    onInput={setBrightnessDrag}
                    onClick={sendBrightness}
                    />
                  <div ref={tooltipRef} className='sliderTooltip' style={{display: 'none'}}>
                    {brightness}%
                  </div>
                </div>
              </div>
            </div>
          {card.fan && card.fan.length > 0 && (
            <div className='fanCard' id={`${card.fan[0].entity.entity_id}Div`} disabled={isDraggable} key={`${card.fan[0].entity.entity_id}Key`}>
                <div className='fanSpeedContainer'>
                  <button type='button' id={card.fan[0].entity.entity_id} 
                    key={`${card.fan[0].entity.entity_id}Button`}
                    onClick={e => fanToggle(e, card)} >
                      <Icon className='mdiFan' path={card.fan[0].entity.state === 'on' ? mdiFan : card.fan[0].entity.state === 'off' ? mdiFanOff : null} 
                        size={'20px'} 
                        key={`${card.fan[0].entity.entity_id}Icon`} 
                        style={{
                          animation:card.fan[0].entity.state === 'off' ? '' : 'fanSpin 1s linear infinite'}}  
                    />
                  </button>
                    <input type='range' id={card.fan[0].entity && card.fan[0].entity.entity_id}
                      ref={fanSpeedRef} 
                      min='0'
                      max='100'
                      step='16.66666'
                      value={sliderValue}
                      onChange={e => handleChange(e)} 
                      onClick={e => controlFanSpeed(e, card)}
                    />
                  <div className='fanSpeedSliderContainer' 
                    ref={fanSpeedContainerRef}
                    style={{
                      width: card.fan[0].entity.state === 'on' ? `${fanSpeedWidth}` : '0px',
                      transition: 'width 0.3s ease'
                    }}>
                  </div>
                </div>
            </div>
          )}
        </div>
        {children}
      </div>
    );
  }

  const [sliderValue, setSliderValue] = useState(25);
    
    function handleChange(e) {
      const eVal = e.target.value;
      setSliderValue(eVal);
      setFanSpeedWidth(`${Math.round((eVal / 100) * 210)}px`)
    }

  function controlFanSpeed(e, card) {
      const fanPct = e.target.value;
      setSliderValue(fanPct);
      if (card.fan && card.fan[0].entity.state === 'on') {
        ws.send(JSON.stringify({
          id: serviceSocketId,
          type: 'call_service',
          domain: 'fan',
          service: 'set_percentage',
          service_data: {
            percentage: Math.round(fanPct)
          },
          target: {
            entity_id: card.fan[0].entity.entity_id
          }
        }))
      }
      if (card.fan && card.fan[0].entity.state === 'off') {
        ws.send(JSON.stringify({
          id: serviceSocketId,
          type: 'call_service',
          domain: 'fan',
          service: 'set_percentage',
          service_data: {
            percentage: Math.round(fanPct)
          },
          target: {
            entity_id: card.fan[0].entity.entity_id
          }
        }))
      }
      setServiceSocketID(idCheck + 1);
    }
  
  function fanToggle(e, card) {
      if (card.fan && card.fan[0].entity.state === 'on') {
        ws.send(JSON.stringify({
          id: serviceSocketId,
          type: 'call_service',
          domain: 'fan',
          service: 'turn_off',
          target: {
            entity_id: card.fan[0].entity.entity_id
          }
        }))
      }
      if (card.fan && card.fan[0].entity.state === 'off') {
        console.log('fan is off');
        ws.send(JSON.stringify({
          id: serviceSocketId,
          type: 'call_service',
          domain: 'fan',
          service: 'turn_on',
          target: {
            entity_id: card.fan[0].entity.entity_id
          }
        }))
      }
      setServiceSocketID(idCheck + 1);
    }

  const holidays = [];
  holidays[0] = [20]; holidays[1] = []; holidays[2] = []; holidays[3] = []; holidays[4] = [26]; 
  holidays[5] = [19]; holidays[6] = [4]; holidays[7] = [11]; holidays[8] = [1]; holidays[9] = [13];
  holidays[10] = [11, 27]; holidays[11] = [25];

  class Calendar {
    constructor(year, month) {
      this.year = year;
      this.month = month;
      this.date = new Date(year, month, 1); // first day of month
    }

    get monthName() {
      return this.date.toLocaleString('default', { month: 'long' });
    }

    get daysInMonth() {
      return new Date(this.year, this.month + 1, 0).getDate();
    }

    get firstDayOfWeek() {
      return new Date(this.year, this.month, 1).getDay(); // 0 - 6
    }

    getDays() {
      const days = [];
      const totalDays = this.daysInMonth;
      const startDay = this.firstDayOfWeek;

      for (let i = 0; i < startDay; i++) {
        days.push(`null${i}`);
      }

      for (let day = 1; day <= totalDays; day++) {
        days.push({
          day,
          date: new Date(this.year, this.month, day),
          isToday: this.isToday(day),
          isHoliday: this.isHoliday(day),
          trashDay: this.trashDay(new Date(this.year, this.month, day))
        });
      }
      return days;
    }

    isToday(day) {
      const today = new Date();
      return (
        day === today.getDate() &&
        this.month === today.getMonth() &&
        this.year === today.getFullYear()
      );
    }

    isHoliday(day) {
      return (
        holidays[this.month].includes(day)
      )
    }

    trashDay(day) {
      const dayOfMonth = day.getDate();
      const dayOfWeek = day.getDay();
      
      const holidayWeek = () => {
        const isOnHoliday = holidays[this.month].some(holiday => 
          dayOfMonth === holiday && dayOfWeek === 5
        );
        if (isOnHoliday) {return true};

        // Check if within 5 days after any holiday this month
        const isAfterHoliday = holidays[this.month].some(holiday => 
          dayOfMonth > holiday && (dayOfMonth - holiday) <= 5
        );
        if (isAfterHoliday) {return true};

        // Check if within 5 days of holiday from previous month
        const firstFriday = dayOfMonth <= 6 && dayOfWeek === 5;
        if (firstFriday) {
          if (this.month === 0) {
            if (holidays[11].some(holiday => {
              const lastDecember = new Date(this.year - 1, 11, holiday);
              const lastDecemberDate = lastDecember.getDate();
              (dayOfMonth - lastDecemberDate)*-1 === lastDecemberDate - dayOfMonth
            })) {
              return true
            }
          }
          if (holidays[this.month - 1]){
            if (holidays[this.month - 1].some(holiday => {
              const lastMonthHoliday = new Date(this.year, this.month - 1, holiday);
              const lastMonthHolidayDate = lastMonthHoliday.getDate();
              (dayOfMonth - lastMonthHolidayDate)*-1 === lastMonthHolidayDate - dayOfMonth
            })) {
              return true
            }
          }
        }
        return false
      }
      // Saturday if after holiday, Friday otherwise
      return (holidayWeek() ? dayOfWeek === 6: dayOfWeek === 5)
  }
      

    nextMonth() {
      if (this.month === 11) {
        return new Calendar(this.year + 1, 0);
      }
      return new Calendar(this.year, this.month + 1);
    }

    prevMonth() {
      if (this.month === 0) {
        return new Calendar(this.year - 1, 11);
      }
      return new Calendar(this.year, this.month - 1);
    }
  }

  const [calendar, setCalendar] = useState(() => {
    const now = new Date();
    return new Calendar(now.getFullYear(), now.getMonth());
  });
  const CalendarDays = () => {

    const days = calendar.getDays();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
    
        return (
        days.map(day => (
          <div className='calendarDay' key={days.findIndex(ind => ind === day)} >
            <span className='dateStamp' key={`${day.date} ${day.day}`}
              style={{color: day.isToday ? 'white' : day.isHoliday ? 'red' : 'black'
              }}>
                {day.day}
            </span>
            {day.trashDay ?
             <Icon path={mdiTrashCan} className='mdiTrashCan' size={1} />
             : null}
          </div>
        ))
    )
  }

  if (changedEntity) {
    if (lightCards.find(card => card.entity.entity_id === changedEntity.data.entity_id)) {
      lightCards[lightCards.findIndex(card => card.entity.entity_id === changedEntity.data.entity_id)].entity.attributes = changedEntity.data.new_state.attributes;
      lightCards[lightCards.findIndex(card => card.entity.entity_id === changedEntity.data.entity_id)].entity.state = changedEntity.data.new_state.state;
      localStorage.setItem('cards', JSON.stringify(lightCards));
      setChangedEntity(null);
    }
    if (lightCards.find(card => card.sensor.some(s => s.entity.entity_id === changedEntity.data.entity_id))) {
      const cardIndex = lightCards.findIndex(card => card.sensor.some(s => s.entity.entity_id === changedEntity.data.entity_id));
      const sensorIndex = lightCards[cardIndex].sensor.findIndex(s => s.entity.entity_id === changedEntity.data.entity_id);
      lightCards[cardIndex].sensor[sensorIndex].entity.state = changedEntity.data.new_state.state;
      localStorage.setItem('cards', JSON.stringify(lightCards));
      setChangedEntity(null);
    }
    if (thermostat.entity_id === changedEntity.data.entity_id) {
      console.log('Thermostat change captured');
      thermostat.attributes.hvac_action = changedEntity.data.new_state.attributes.hvac_action;
      console.log('hvac_action changed to: ', changedEntity.data.new_state.attributes.hvac_action);
      thermostat.attributes.temperature = changedEntity.data.new_state.attributes.temperature;
      console.log('temperature changed to: ', changedEntity.data.new_state.attributes.temperature);
      thermostat.attributes.current_temperature = changedEntity.data.new_state.attributes.current_temperature;
      console.log('current_temperature changed to: ', changedEntity.data.new_state.attributes.current_temperature);
      localStorage.setItem('thermostat', JSON.stringify(thermostat));
      setChangedEntity(null);
    }
    if (lightCards.find(card => card.outlet && card.outlet.some(o => o.entity.entity_id === changedEntity.data.entity_id))) {
      const cardIndex = lightCards.findIndex(card => card.outlet && card.outlet.some(o => o.entity.entity_id === changedEntity.data.entity_id));
      const outletIndex = lightCards[cardIndex].outlet.findIndex(o => o.entity.entity_id === changedEntity.data.entity_id);
      lightCards[cardIndex].outlet[outletIndex].entity.state = changedEntity.data.new_state.state;
      localStorage.setItem('cards', JSON.stringify(lightCards));
      console.log('outlet updated: ', changedEntity.data.new_state.state);
      setChangedEntity(null);
    }
    if (lightCards.find(card => card.fan && card.fan.some(f => f.entity.entity_id === changedEntity.data.entity_id))) {
      const cardIndex = lightCards.findIndex(card => card.fan && card.fan.some(f => f.entity.entity_id === changedEntity.data.entity_id));
      const fanIndex = lightCards[cardIndex].fan && lightCards[cardIndex].fan.findIndex(f => f.entity.entity_id === changedEntity.data.entity_id);
      lightCards[cardIndex].fan[fanIndex].entity.state = changedEntity.data.new_state.state;
      lightCards[cardIndex].fan[fanIndex].entity.attributes.percentage = changedEntity.data.new_state.attributes.percentage;
      setFanSpeedWidth(`${Math.round(210 * (changedEntity.data.new_state.attributes.percentage * 0.01))}px`)
      localStorage.setItem('cards', JSON.stringify(lightCards));
      setChangedEntity(null);
      console.log('updated: ', changedEntity);
    }
  }
  return ( 
    <>
        {/* IMPORTANT --- in order to use two gradients, needed to put both in their own <def> */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <linearGradient id='waveBackgroundGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop offset='10%' stopColor='rgba(86, 17, 133, 1)' />
              <stop offset='80%' stopColor='rgb(10, 31, 88)' />
              {/* <stop offset='80%' stopColor='rgb(86, 17, 133)' /> */}
              {/* <stop offset='60%' stopColor='rgb(10, 31, 88)' /> */}
            </linearGradient>
            <linearGradient id='test' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop offset='10%' stopColor='rgba(113, 25, 172, 1)' />
              <stop offset='60%' stopColor='rgba(13, 39, 109, 1)' />
              {/* <stop offset='90%' stopColor='rgba(113, 25, 172, 1)' /> */}
              {/* <stop offset='60%' stopColor='rgb(86, 17, 133)' /> */}
            </linearGradient>    
          </defs>
        </svg>
        <svg id='waveBackground' viewBox='0 0 100 100' preserveAspectRatio='none'>
              <path d=
                'M 0, 0 L 0, 100 L 100, 100 A 50, 55, 45, 0, 0, 50, 25 A 50, 50, -45, 0, 1, 0, 0' />
        </svg>
        <svg id='waveBackground-2' viewBox='0 0 100 100' preserveAspectRatio='none'>
          <path d=
            'M 100, 100 L 100, 0 L 0, 0 A 50, 50, 45, 0, 0, 50, 25 A 55, 50, -45, 0, 1, 100, 100'/>
        </svg>
        <div className="createDivContainer" ref={createDivRef}>
          <button type='button' id='createCard' onClick={createMenu}>
            Create
          </button>
          <button type='button' id='dragToggle' onClick={toggleDrag}>
            <Icon path={isDraggable ? mdiLockOffOutline : mdiLockOutline}
            size={'16px'} className='mdiLockOutline' />
          </button>
        </div>
        <div className='entityContainer' 
          style={{display: isMenuVisible ? 'grid' : 'none', opacity: opacity}}>
          <NameCard
            key='nameNewCard'
            />
          <SelectParentCard key={selected} />
          <div ref={createRef} className='createCardEntitySelect' 
            style={{
              display: isMenuVisible ? 'grid' : 'none', 
              opacity: opacity
            }} 
          >
            <Icon path={mdiMagnify} size={1} className='mdiMagnify'
              onMouseUp={() => setIsSearching(true)}
              style={{
                position: 'fixed',
                justifySelf: 'end', 
                marginBottom: '2px'
                }}
            /> 
            <input ref={searchBar} type='text' id='searchBar' defaultValue='Search' autoComplete='off'
              onFocus={() => {
                searchBar.current.value = ''; 
                searchBar.current.select();
              }}
              onChange={lookupSearch}
            />
            <button type='button' className='entitySelection' id='thermostat' 
              style={{display: tstatCard === false ? 'block' : 'none'}}
              onClick={getThermostat}
              >
              Thermostat
            </button>
            <button type='button' className='entitySelection' id='plugEntity' onClick={getOutlets}>
              Plugs
            </button>
            <OutletList />
            <button type='button' className='entitySelection' id='fanEntity' onClick={getFans}>
              Fans
            </button>
            <FanList />
            <button type='button' className='entitySelection' id='lightEntity' onClick={getLights}>
              Light
            </button>
            <div ref={lightsRef} className='lightList'
              style={{maxHeight: lightMaxHeight}}>
              <LightList />
              <SearchResultsLights />
              </div>
              <button type='button' className='entitySelection' buttonid='sensorEntity' onClick={getSensors}>
                Sensor
              </button>
              <div ref={sensorsRef} className='sensorList'
                style={{ 
                  maxHeight: sensorMaxHeight}}>
                <SensorList />
                <SearchResultsSensors />
              </div>
          </div> 
        </div>
        <div className='cardContainer'>
          <ThermostatCard
            key={thermostat.entity_id}
            />
          {/* Render all created light cards at top level */}
          {lightCards.map(card => (
            <LightCard 
              key={card.id} 
              entity={card.entity}
              entityName={card.id}
              entityRGB={card.entity.attributes.rgb_color}
              // sensors={[card.sensor]}
              card={card}
            >
              {card.outlet && card.outlet.length > 0 && card.outlet.map(o => (
                <OutletCards 
                  key={o.entity.entity_id}
                  entity_id={o.entity.entity_id} 
                  entity={o.entity} 
                  state={o.entity.state} />
              ))}
            </LightCard>
            ))}
              
          
        </div>
        <div ref={calendarRef} id='calendarContainer'>
            <span id='monthName'>
              <button type='button' id='prevMonth' onClick={() => setCalendar(calendar.prevMonth())}>
                {'<'}
              </button>
              {`${calendar.monthName} ${calendar.year}`}
              <button type='button' id='nextMonth' onClick={() => setCalendar(calendar.nextMonth())}>
                {'>'}
              </button>
              </span>
            <div className='weekday'>
              <span id='sunday'>Sun</span>
              <span id='monday'>Mon</span>
              <span id='tuesday'>Tues</span>
              <span id='wednesday'>Wed</span>
              <span id='thursday'>Thurs</span>
              <span id='friday'>Fri</span>
              <span id='saturday'>Sat</span>
            </div>
            <div className='calendarDays'>
              <CalendarDays />
            </div>
        </div>
    </>
  )
}

export default App