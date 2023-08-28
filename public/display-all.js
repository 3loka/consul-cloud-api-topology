fetch('/api/data')
  .then(response => response.json())
  .then(data => {
    console.log("inside")
    const { organizationData, projectData, clusterData, nodeData, serviceData, serviceInstanceData, intentionData } = data;

    let nodes = new vis.DataSet([
      ...organizationData.organization.map(organization => ({ id: organization.id, label: organization.name, group: 'organization', data: organization })),
      ...projectData.project.map(project => ({ id: project.id, label: project.name, group: 'project', data: project })),
      ...clusterData.cluster.map(cluster => ({ id: cluster.id, label: cluster.name, group: 'cluster', data: cluster })),

      ...nodeData.node.map(node => ({ id: node.id, label: node.name, group: 'node', data: node })),
      ...serviceData.service.map(service => ({ id: service.id, label: service.name, group: 'service', data: service })),
    //   ...serviceInstanceData.service_instance.map(serviceInstance => ({ id: serviceInstance.id, label: serviceInstance.instance_id, group: 'service-instance', data: serviceInstance })),
    ]);

    let edges = new vis.DataSet([
        ...projectData.project.map(project => ({ from: project.parent_organization, to: project.id })),
        ...clusterData.cluster.map(cluster => ({ from: cluster.parent_project, to: cluster.id })),
        ...nodeData.node.map(node => ({ from: node.parent_cluster, to: node.id })),
        ...serviceData.service.map(service => ({
            from: service.parent_node,
            to: service.id,
            dashes: [5, 5], // Add dashes to create a dotted line
            smooth: {
              enabled: false
            }
          })),
        // ...serviceInstanceData.service_instance.map(serviceInstance => ({ from: serviceInstance.parent_service, to: serviceInstance.id })),
        ...intentionData.intention.map(intention => ({
          from: intention.source,
          to: intention.destination,
          color: intention.action === "allow" ? "green" : "red",
          arrows: {
            to: {
              enabled: true, // Enable arrow on the 'to' side
              type: 'arrow'
            }
          },
        }))
      ]);
  

    let data1 = {
      nodes: nodes,
      edges: edges,
    };

    let options = {
        groups: {
          organization: { color: { background: 'blue' }},
          cluster: { color: { background: 'red' }},
          node: { color: { background: 'green' }},
          service: { color: { background: 'yellow' }},
          'service-instance': { color: { background: 'purple' }}
        },
        nodes: {
          shape: 'dot',
          size: 30,
          font: {
            size: 32,
            color: '#000000'
          },
          borderWidth: 2
        },
        edges: {
          width: 2
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 100,
            fit: true
          },
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.01,
            springLength: 500,
            springConstant: 0.01,
            damping: 0.09
          }
        },
        interaction: {
          hover: true,
          hoverConnectedEdges: true
        },
        configure: {
          filter: function(option, path) {
            return (path.indexOf('physics') !== -1);
          },
          showButton: false
        }
      };

    let network = new vis.Network(document.getElementById("mynetwork"), data1, options);

    network.on("click", function(properties) {
        var ids = properties.nodes;
        var clickedNodes = nodes.get(ids);
      
        if (clickedNodes.length > 0) {
          var clickedNode = clickedNodes[0];
          var detailsPane = document.getElementById('detailsPane');
          var nodeData = clickedNode.data;
      
          if (clickedNode.group === 'service') {
            // Find the corresponding service instances for the clicked service node
            var correspondingInstances = serviceInstanceData.service_instance.filter(function(instance) {
              return instance.parent_service === clickedNode.id;
            });
      
            // Add the service instances to the node data
            nodeData.instances = correspondingInstances;
          }
      
          detailsPane.innerHTML = JSON.stringify(nodeData, null, 2);
        }
      });
      
      
  });
