import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import axios from 'axios';

import './styles.css';
import logo from '../../assets/logo.svg';
import { FiArrowLeft } from 'react-icons/fi';

import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';


interface Item {
    id: number,
    title: string,
    image_url: string,
}

interface UF {
    name: string;
}

interface IBGEUFresponse {
    sigla: string;
};

interface IBGECityResponse {
    nome: string;
};

const CreatePoint = () => {

    const [items, setItems ] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [initialPosition, setInitialtPosition] = useState<[number, number]>([0, 0]);

    const [selectItems, setSelectItems] = useState<number[]>([]);

    const [selectUf, setSelectUf] = useState('0');
    const [selectCity, setSelectCity] = useState('0');
    const [selectPosition, setSelectPosition] = useState<[number, number]>([0, 0]);

    const [ formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    })


    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialtPosition([latitude, longitude]);
        })
    }, [])

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        });
    },[]);

    useEffect(() => {
        axios.get<IBGEUFresponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response =>{
            const ufInitials = response.data.map(uf => uf.sigla);

            setUfs(ufInitials);
        });
    })

    useEffect(() => {
        if(selectUf === '0') {
            return;
        }

        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectUf}/municipios`).then(response =>{
            const cityName = response.data.map(city => city.nome);

            setCities(cityName);
        });


    }, [selectUf] );

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;

        setSelectUf(uf);
    };


    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;

        setSelectCity(city);
    };

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectPosition([
            event.latlng.lat,
            event.latlng.lng,

        ])
    };

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
       const { name, value } = event.target;
       
        setFormData({ ...formData, [name]: value });
    }

    function handleSelectItem(id: number) {

        const alreadySelected = selectItems.findIndex(item => item === id);

        if (alreadySelected >= 0) {
            const filteredItems = selectItems.filter(item => item !== id);
            
            setSelectItems(filteredItems);

        } else {
            setSelectItems([ ...selectItems, id]);
        }
    };

     async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectUf;
        const city = selectCity;
        const [ latitude, longitude ] = selectPosition;
        const items = selectItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }

        await api.post('points', data);

        alert('Ponto de coleta cadastrado');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt=""/>

                <Link to="/"><FiArrowLeft /> Voltar para a home</Link>
            </header>

            <form onClick={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="id" onChange={handleInputChange} />
                    </div>
                    <div className="field-group">
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input type="email" name="email" id="email" onChange={handleInputChange} />
                    </div>
                    <div className="field">
                        <label htmlFor="whatsapp">WhatsApp</label>
                        <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
                        
                    </div>
                    
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione um endereço no mapa</span>
                    </legend>
                        <Map center={initialPosition} zoom={14} onclick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <Marker position={selectPosition} />

                        </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado/UF</label>
                            <select name="uf" id="uf" value={selectUf} onChange={handleSelectUf}>
                                <option value="0">Selecione o estado</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectCity} onChange={handleSelectCity}>
                                <option value="0">Selecione a cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Ítems de coleta</h2>
                        <span>Selecione um ou mais items abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                            key={item.id} 
                            onClick={() => handleSelectItem(item.id)}
                             className={selectItems.includes(item.id) ? 'selected' : ''}>
                            <img src={item.image_url} alt={item.title} />
                            <span>{item.title}</span>
                        </li>

                        ))}

                    </ul>
                </fieldset>

                <button type="submit">Cadastrar</button>
            </form>
        </div>
    )
};

export default CreatePoint;