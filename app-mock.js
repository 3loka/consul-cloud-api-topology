const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/organizations/:orgId', (req, res) => {
  const orgId = req.params.orgId;
  const organizationData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'organizations.json')));

  const org = organizationData.organization.find(org => org.id === orgId);

  if (org) {
    res.json(org);
  } else {
    res.status(404).json({ error: 'Organization not found.' });
  }
});

app.get('/organizations/:orgId/projects', (req, res) => {
  const orgId = req.params.orgId;
  const projectData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'projects.json')));

  const projects = projectData.project.filter(project => project.parent_organization === orgId);

  res.json(projects);
});

app.get('/organizations/:orgId/projects/:projectId/clusters', (req, res) => {
  const projectId = req.params.projectId;
  const clusterData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'clusters.json')));

  const clusters = clusterData.cluster.filter(cluster => cluster.parent_project === projectId);

  res.json(clusters);
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes', (req, res) => {
  const clusterId = req.params.clusterId;
  const nodeData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'nodes.json')));

  const nodes = nodeData.node.filter(node => node.parent_cluster === clusterId);

  res.json(nodes);
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes/:nodeId/services', (req, res) => {
  const nodeId = req.params.nodeId;
  const serviceData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'services.json')));

  const services = serviceData.service.filter(service => service.parent_node === nodeId);

  res.json(services);
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes/:nodeId/services/:serviceId/instances', (req, res) => {
  const serviceId = req.params.serviceId;
  const serviceInstanceData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'service-instances.json')));

  const instances = serviceInstanceData.service_instance.filter(instance => instance.parent_service === serviceId);

  res.json(instances);
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/intentions', (req, res) => {
  const intentionDataPath = path.join(__dirname, 'data', 'intentions.json');

  fs.readFile(intentionDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error while reading intentions data: ${err}`);
      res.status(500).send(`Error while reading intentions data: ${err}`);
      return;
    }

    try {
      const intentionData = JSON.parse(data);
      const transformedData = Object.entries(intentionData).map(([clusterId, cluster]) => {
        const intentions = cluster.intention;
        return {
          clusterId,
          intention: intentions.map(intention => ({
            source: intention.source,
            destination: intention.destination,
            action: intention.action,
          })),
        };
      });
      res.json(transformedData);
    } catch (error) {
      console.error(`Error while parsing intentions data: ${error}`);
      res.status(500).send(`Error while parsing intentions data: ${error}`);
    }
  });
});

app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/partitions', (req, res) => {
  const clusterId = req.params.clusterId;
  const serviceData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'services.json')));

  const partitions = [...new Set(serviceData.service.map(service => service.Partition))];

  console.log(partitions);
  res.json(partitions);
});


app.get('/organizations/:orgId/projects/:projectId/clusters/:clusterId/namespaces', (req, res) => {
  const clusterId = req.params.clusterId;
  const serviceData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'services.json')));

  const partitions = [...new Set(serviceData.service.map(service => service.Namespace))];

  res.json(namespaces);
});




app.listen(3000, () => console.log('Server running on port 3000'));
