require('dotenv').config();

const express = require('express');
const app = express();
let fetch;

app.use(express.static('public')); 

async function loadDependencies() {
  fetch = (await import('node-fetch')).default;
}

const CONSUL_API = process.env.CONSUL_API;  
const ACL_TOKEN = process.env.ACL_TOKEN;  


loadDependencies().then(() => {
  // The rest of your script goes here, where 'fetch' is now available

async function fetchConsulData(endpoint) {
  const response = await fetch(`${CONSUL_API}/${endpoint}`, {
    headers: {
      'X-Consul-Token': ACL_TOKEN
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function buildJson() {
  try {
    // Fetch services
    const servicesNames = await fetchConsulData('catalog/services');
    let servicesData = [];

    for (const serviceName in servicesNames) {
      const serviceNodes = await fetchConsulData(`catalog/service/${serviceName}`);
      
      const serviceData = {
        name: serviceName,
        id: serviceName,
        tags: servicesNames[serviceName],
        address: serviceNodes[0].ServiceAddress,
        port: serviceNodes[0].ServicePort,
        parent_node: serviceNodes[0].Node,
      };

      servicesData.push(serviceData);
    }

    console.log(servicesData);

    // Fetch nodes
    let nodesData = [];
    for (const serviceData of servicesData) {
      const nodeDataRaw = await fetchConsulData(`catalog/node/${serviceData.parent_node}`);
      const nodeData = {
        name: nodeDataRaw.Node.Node,
        id: nodeDataRaw.Node.Node,
        address: nodeDataRaw.Node.Address,
        parent_cluster: nodeDataRaw.Node.Datacenter,
        status: nodeDataRaw.Node.Status,
        datacenter: nodeDataRaw.Node.Datacenter,
        meta: nodeDataRaw.Node.Meta,
        config: nodeDataRaw.Node.Config,
        coordinates: nodeDataRaw.Node.Coordinates
      };

      nodesData.push(nodeData);
    }

    console.log(nodesData);

    // Fetch service instances
    let serviceInstancesData = [];
    for (const serviceData of servicesData) {
      const serviceInstanceDataRaw = await fetchConsulData(`health/service/${serviceData.name}`);
      const serviceInstanceData = {
        id: serviceInstanceDataRaw[0].Service.ID,
        node: serviceInstanceDataRaw[0].Node,
        address: serviceInstanceDataRaw[0].Service.Address,
        port: serviceInstanceDataRaw[0].Service.Port,
        parent_service: serviceInstanceDataRaw[0].Service.Service,
        service_tags: serviceInstanceDataRaw[0].Service.Tags,
        status: serviceInstanceDataRaw[0].Checks[0].Status,
        meta: serviceInstanceDataRaw[0].Service.Meta
      };

      serviceInstancesData.push(serviceInstanceData);
    }

    console.log(serviceInstancesData);

    // Intention data
    const intentionsData = await fetchConsulData('connect/intentions');
    console.log(intentionsData);

  } catch (error) {
    console.log(error);
  }
}

buildJson();
});