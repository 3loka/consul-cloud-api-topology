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

console.log(`CONSUL_API: ${CONSUL_API}`);

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

app.get('/organizations/:orgId', (req, res) => {
  const orgId = req.params.orgId;
  if (orgId !== 'demo-org') {
    res.status(404).json({ error: 'Organization not found.' });
  } else {
    res.json({
      name: "Demo Org",
      id: "demo-org",
      description: "Organization responsible for developing and maintaining the company's software infrastructure"
    });
  }
});

app.get('/organizations/:orgId/projects', (req, res) => {
  const orgId = req.params.orgId;
  if (orgId !== 'demo-org') {
    res.status(404).json({ error: 'Project not found.' });
  } else {
    res.json([
      {
        name: "Demo Project",
        id: "demo-project",
        parent_organization: "demo-org",
        description: "Project for developing and maintaining the e-commerce platform"
      }
    ]);
  }
});

app.get('/organizations/:orgId/projects/:projectId/clusters', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    if (projectId !== 'demo-project') {
      res.status(404).json({ error: 'Cluster not found.' });
    } else {
      // Make a call to Consul API to fetch data
      const servicesDataRaw = await fetchConsulData('catalog/services');
      const servicesData = Object.keys(servicesDataRaw).map(serviceName => ({ name: serviceName }));

      let clusterData = [];

      for (const serviceData of servicesData) {
        const serviceInstancesRaw = await fetchConsulData(`catalog/service/${serviceData.name}`);

        for (const instance of serviceInstancesRaw) {
          if (!clusterData.find(dc => dc.name === instance.Datacenter)) {
            clusterData.push({ name: instance.Datacenter, parent_project: 'demo-project', id: instance.Datacenter });
          }
        }
      }
      res.json(clusterData);
    }
  } catch (error) {
    console.error(`Error while fetching data: ${error}`);
    res.status(500).send(`Error while fetching data: ${error}`);
  }
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes', async (req, res) => {
  try {
    const clusterId = req.params.clusterId;
    // Make a call to Consul API to fetch data
    const nodeDataRaw = await fetchConsulData(`catalog/nodes?dc=${clusterId}`);
    const nodeData = nodeDataRaw.map(node => ({
      name: node.Node,
      id: node.ID,
      address: node.Address,
      parent_cluster: clusterId,
      status: node.Status,
      datacenter: clusterId,
      meta: node.NodeMeta,
      ...node
    }));
    res.json(nodeData);
  } catch (error) {
    console.error(`Error while fetching data: ${error}`);
    res.status(500).send(`Error while fetching data: ${error}`);
  }
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes/:nodeId/services', async (req, res) => {
  try {
    const nodeId = req.params.nodeId;
    // Make a call to Consul API to fetch data
    const servicesDataRaw = await fetchConsulData(`catalog/node/${nodeId}`);

    const servicesMapById = new Map();
    const servicesMapByName = new Map();
    Object.values(servicesDataRaw.Services).forEach(service => {
      // Only add to the services list if the ID and name are not already present and the ServiceKind is not 'connect-proxy'
      if (!servicesMapById.has(service.ID) && !servicesMapByName.has(service.Service) && service.Kind !== 'connect-proxy') {
        servicesMapById.set(service.ID, {
          parent_node: nodeId,
          name: service.Service,
          id: service.ID,
          ...service
        });
        servicesMapByName.set(service.Service, true); // No need to store full object, just mark it as seen
      }
    });

    const servicesData = Array.from(servicesMapById.values());

    res.json(servicesData);
  } catch (error) {
    console.error(`Error while fetching data: ${error}`);
    res.status(500).send(`Error while fetching data: ${error}`);
  }
});



app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes/:nodeId/services/:serviceId/instances', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    // Make a call to Consul API to fetch data
    const serviceInstancesRaw = await fetchConsulData(`catalog/service/${serviceId}`);
    const serviceInstanceData = serviceInstancesRaw.map(instance => ({
      parent_service: serviceId,
      node: instance.Node,
      address: instance.Address,
      id: instance.ServiceID,
      ...instance
    }));
    res.json(serviceInstanceData);
  } catch (error) {
    console.error(`Error while fetching data: ${error}`);
    res.status(500).send(`Error while fetching data: ${error}`);
  }
});


app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/intentions', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    // Make a call to Consul API to fetch data
    const intentionDataRaw = await fetchConsulData(`connect/intentions`);
    const intentionData = intentionDataRaw
      .map(intention => ({
        source: intention.SourceName,
        destination: intention.DestinationName,
        action: intention.Action,
        ...intention
      }));
    res.json(intentionData);
  } catch (error) {
    console.error(`Error while fetching data: ${error}`);
    res.status(500).send(`Error while fetching data: ${error}`);
  }
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/partitions', async (req, res) => {
  try {
    // Make a call to Consul API to fetch partitions
    const partitionDataRaw = await fetchConsulData(`partitions`);
    res.json(partitionDataRaw);
  } catch (error) {
    console.error(`Error while fetching partition data: ${error}`);
    res.status(500).send(`Error while fetching data: ${error}`);
  }
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/namespaces', async (req, res) => {
  try {
    // Make a call to Consul API to fetch namespaces
    const namespaceDataRaw = await fetchConsulData(`namespaces`);
    res.json(namespaceDataRaw);
  } catch (error) {
    console.error(`Error while fetching namespace data: ${error}`);
    res.status(500).send(`Error while fetching data: ${error}`);
  }
});



loadDependencies().then(() => {
  app.listen(3000, () => console.log('Server running on port 3000'));
}).catch((err) => {
  console.error(`Error while loading dependencies: ${err}`);
});
