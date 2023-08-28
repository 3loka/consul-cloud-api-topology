async function fetchData(orgId) {
    try {

        showLoadingMessage();

        //   clearCache();
        const cachedData = localStorage.getItem('graphData');
        if (cachedData) {
            const data = JSON.parse(cachedData);
            renderGraph(data);
        } else {
            orgId = "demo-org";
            // Fetch data from the server
            const organizationResponse = await fetch(`/organizations/${orgId}`);
            if (!organizationResponse.ok) throw new Error('Network response was not ok');
            const organizationData = await organizationResponse.json();

            const projectResponse = await fetch(`/organizations/${orgId}/projects`);
            if (!projectResponse.ok) throw new Error('Network response was not ok');
            const projectData = await projectResponse.json();

            const data = {
                organizationData: {
                    organization: [organizationData]
                },
                projectData: {
                    project: projectData
                },
                clusterData: {},
                nodeData: {},
                serviceData: {},
                serviceInstanceData: {},
                intentionData: {},
                partitionData: {},
                namespaceData: {},
            };

            for (const project of projectData) {
                const projectId = project.id;

                const clusterResponse = await fetch(`/organizations/${orgId}/projects/${projectId}/clusters`);
                if (!clusterResponse.ok) throw new Error('Network response was not ok');
                const clusterData = await clusterResponse.json();

                data.clusterData[projectId] = {
                    cluster: clusterData
                };

                for (const cluster of clusterData) {
                    const clusterId = cluster.id;

                    // Fetch data for partitions
                    const partitionResponse = await fetch(`/organizations/${orgId}/projects/${projectId}/clusters/${clusterId}/partitions`);
                    if (!partitionResponse.ok) throw new Error('Network response was not ok');
                    const partitionData = await partitionResponse.json();

                    data.partitionData[clusterId] = {
                        partition: partitionData
                    };

                    // Fetch data for namespaces
                    const namespaceResponse = await fetch(`/organizations/${orgId}/projects/${projectId}/clusters/${clusterId}/namespaces`);
                    if (!namespaceResponse.ok) throw new Error('Network response was not ok');
                    const namespaceData = await namespaceResponse.json();

                    data.namespaceData[clusterId] = {
                        namespace: namespaceData
                    };

                    const nodeResponse = await fetch(`/organizations/${orgId}/projects/${projectId}/clusters/${clusterId}/nodes`);
                    if (!nodeResponse.ok) throw new Error('Network response was not ok');
                    const nodeData = await nodeResponse.json();

                    data.nodeData[clusterId] = {
                        node: nodeData
                    };

                    for (const node of nodeData) {
                        const nodeId = node.id;

                        const serviceResponse = await fetch(`/organizations/${orgId}/projects/${projectId}/clusters/${clusterId}/nodes/${nodeId}/services`);
                        if (!serviceResponse.ok) throw new Error('Network response was not ok');
                        const serviceData = await serviceResponse.json();

                        data.serviceData[nodeId] = {
                            service: serviceData
                        };

                        for (const service of serviceData) {
                            const serviceId = service.id;

                            const instanceResponse = await fetch(`/organizations/${orgId}/projects/${projectId}/clusters/${clusterId}/nodes/${nodeId}/services/${serviceId}/instances`);
                            if (!instanceResponse.ok) throw new Error('Network response was not ok');
                            const serviceInstanceData = await instanceResponse.json();

                            data.serviceInstanceData[serviceId] = {
                                service_instance: serviceInstanceData
                            };
                        }
                    }

                    const intentionResponse = await fetch(`/organizations/${orgId}/projects/${projectId}/clusters/${clusterId}/intentions`);
                    if (!intentionResponse.ok) throw new Error('Network response was not ok');
                    const intentionData = await intentionResponse.json();

                    data.intentionData[clusterId] = {
                        intention: intentionData
                    };
                    console.log("getting intentions")
                    console.log(data.intentionData)
                }
            }

            localStorage.setItem('graphData', JSON.stringify(data));
            renderGraph(data);
        }
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }



}



function renderGraph(data) {
    const {
        organizationData = {},
            projectData = {},
            clusterData = {},
            nodeData = {},
            serviceData = {},
            serviceInstanceData = {},
            intentionData = {},
            partitionData = {},
            namespaceData = {},
    } = data;

    // When loading the graph:
    let savedPositions = JSON.parse(localStorage.getItem('nodePositions') || '{}');

    let nodes = new vis.DataSet();
    let edges = new vis.DataSet();

    // Create a map of service names to service IDs
    const serviceIdMap = {};
    Object.values(serviceData).forEach((nodeServices) => {
        (nodeServices.service || []).forEach((service) => {
            serviceIdMap[service.name] = service.id;
        });
    });

    function addNode(node) {
        if (!nodes.get(node.id)) {
            nodes.add(node);
        }
    }

    function addEdge(edge) {
        if (!edges.get(edge.id)) {
            edges.add(edge);
        }
    }

    // Add organizations as nodes
    (organizationData.organization || []).forEach((organization) => {
        addNode({
            id: organization.id,
            label: organization.name,
            group: 'organization',
            data: organization,
            x: savedPositions[organization.id]?.x,
            y: savedPositions[organization.id]?.y,
        });
    });

    // Add projects as nodes and connect them to their parent organizations
    (projectData.project || []).forEach((project) => {
        addNode({
            id: project.id,
            label: project.name,
            group: 'project',
            data: project,
            x: savedPositions[project.id]?.x,
            y: savedPositions[project.id]?.y,
        });

        addEdge({
            id: `${project.parent_organization}-${project.id}`,
            from: project.parent_organization,
            to: project.id,
        });
    });

    // Add clusters as nodes and connect them to their parent projects
    Object.values(clusterData).forEach((projectClusters) => {
        (projectClusters.cluster || []).forEach((cluster) => {
            addNode({
                id: cluster.id,
                label: cluster.name,
                group: 'cluster',
                data: cluster,
                x: savedPositions[cluster.id]?.x,
                y: savedPositions[cluster.id]?.y,
            });

            addEdge({
                id: `${cluster.parent_project}-${cluster.id}`,
                from: cluster.parent_project,
                to: cluster.id,
            });
        });
    });

    // Add nodes as nodes and connect them to their parent clusters
    Object.values(nodeData).forEach((clusterNodes) => {
        (clusterNodes.node || []).forEach((node) => {
            addNode({
                id: node.id,
                label: node.name,
                group: 'node',
                data: node,
                x: savedPositions[node.id]?.x,
                y: savedPositions[node.id]?.y,
            });

            addEdge({
                id: `${node.parent_cluster}-${node.id}`,
                from: node.parent_cluster,
                to: node.id,
            });
        });
    });

    // Add services as nodes and connect them to their parent nodes
    Object.values(serviceData).forEach((nodeServices) => {
        (nodeServices.service || []).forEach((service) => {
            addNode({
                id: service.id,
                label: service.name,
                group: 'service',
                data: service,
                x: savedPositions[service.id]?.x,
                y: savedPositions[service.id]?.y,
            });

            addEdge({
                id: `${service.parent_node}-${service.id}`,
                from: service.parent_node,
                to: service.id,
                dashes: [5, 5], // Add dashes to create a dotted line
                smooth: {
                    enabled: false,
                },
            });
        });
    });


    // Add intentions as edges
    Object.values(intentionData).forEach((cluster) => {
        if (cluster.intention) { // Check if `cluster.intention` exists
            cluster.intention.forEach((intention) => {
                const sourceId = serviceIdMap[intention.source];
                const destinationId = serviceIdMap[intention.destination];

                if (sourceId && destinationId) {
                    addEdge({
                        id: `${sourceId}-${destinationId}`,
                        from: sourceId,
                        to: destinationId,
                        label: intention.action,
                        color: intention.action === "allow" ? "green" : "red",
                        arrows: {
                            to: {
                                enabled: true, // Enable arrow on the 'to' side
                                type: 'arrow'
                            }
                        },
                    });
                }
            });
        }
    });


    let graphData = {
        nodes: nodes,
        edges: edges,
    };


    let options = {
        groups: {
            organization: {
                color: {
                    background: 'blue'
                }
            },
            cluster: {
                color: {
                    background: 'red'
                }
            },
            node: {
                color: {
                    background: 'green'
                }
            },
            service: {
                color: {
                    background: 'yellow'
                }
            },
            'service-instance': {
                color: {
                    background: 'purple'
                }
            }
        },
        nodes: {
            shape: 'dot',
            size: 30,
            font: {
                size: 32,
                color: '#FFFFFF'
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

    let network = new vis.Network(document.getElementById("mynetwork"), graphData, options);

    // After setting up the network and loading nodes/edges:
    network.once("stabilizationIterationsDone", function() {
        let positions = network.getPositions(); // Get the positions of all nodes
        localStorage.setItem("nodePositions", JSON.stringify(positions)); // Save positions
    });

    // Update saved positions if nodes are manually moved:
    network.on("dragEnd", function(params) {
        if (params.nodes.length > 0) {
            let positions = network.getPositions(params.nodes);
            let savedPositions = JSON.parse(localStorage.getItem("nodePositions") || "{}");
            for (let nodeId in positions) {
                savedPositions[nodeId] = positions[nodeId];
            }
            localStorage.setItem("nodePositions", JSON.stringify(savedPositions));
        }
    });

    network.on("click", function(properties) {
        var ids = properties.nodes;
        var clickedNodes = nodes.get(ids);

        if (clickedNodes.length > 0) {

            var clickedNode = clickedNodes[0];
            var detailsPane = document.getElementById('detailsPane');
            var nodeData = clickedNode.data;

            if (clickedNode.group === 'service') {
                // Find the corresponding service instances for the clicked service node
                var correspondingInstances = serviceInstanceData[clickedNode.id]?.service_instance || [];

                // Add the service instances to the node data
                nodeData.instances = correspondingInstances;
            }

            detailsPane.innerHTML = JSON.stringify(nodeData, null, 2);
        }
    });


    function toggleChildNodes(nodeId, nodes, edges, hide) {
        var childNodes = edges.get().filter(edge => edge.from === nodeId).map(edge => edge.to);
        childNodes.forEach(nodeId => {
            var node = nodes.get(nodeId);
            nodes.update({
                id: nodeId,
                hidden: hide
            });
            toggleChildNodes(nodeId, nodes, edges, hide); // Recursive call
        });
    }

    network.on("doubleClick", function(properties) {
        var ids = properties.nodes;
        var clickedNodes = nodes.get(ids);
        if (clickedNodes.length > 0) {
            var clickedNode = clickedNodes[0];
            var immediateChildNodes = edges.get().filter(edge => edge.from === clickedNode.id).map(edge => edge.to);
            var anyChildHidden = immediateChildNodes.some(nodeId => nodes.get(nodeId).hidden);
            toggleChildNodes(clickedNode.id, nodes, edges, !anyChildHidden);
        }
    });

    // Add the reload button to the graph container
    const graphContainer = document.getElementById('mynetwork');
    graphContainer.appendChild(reloadButton);

    // Function to create and style a dropdown menu
    function createDropdown(id, top) {
        const dropdown = document.createElement('select');
        dropdown.id = id;
        dropdown.style.position = 'absolute';
        dropdown.style.top = top;
        dropdown.style.left = '10px';
        dropdown.style.padding = '5px';
        dropdown.style.width = `150px`;

        dropdown.style.backgroundColor = '#fff';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.cursor = 'pointer';
        // dropdown.style.fontWeight = 'bold';
        dropdown.style.color = '#333';
        return dropdown;
    }

    // Function to populate a dropdown menu with options
    function populateDropdown(dropdown, data) {
        // Clear previous dropdown options if any
        dropdown.innerHTML = '';

        // Insert values into dropdown
        (data || []).forEach((item) => {
            let option = document.createElement('option');
            option.text = item.name;
            option.value = item.id;
            dropdown.add(option);
        });
    }

    function populateDropdown(dropdown, data, name) {
        // Clear previous dropdown options if any
        dropdown.innerHTML = '';

        // Default option
        let defaultOption = document.createElement('option');
        defaultOption.text = name === "partition" ? "All Partitions" : "All Namespaces";
        defaultOption.value = "all";
        dropdown.add(defaultOption);

        // Get the first key from the data object
        const firstKey = Object.keys(data)[0];

        // Get the partition data from the nested object
        let actualData = null
        if (name == "partition") {
            actualData = data[firstKey].partition;
        } else {
            actualData = data[firstKey].namespace;
        }

        // Insert values into dropdown
        (actualData || []).forEach((item) => {
            let option = document.createElement('option');
            option.text = item.Name;
            option.value = item.Name;
            dropdown.add(option);
        });
    }


    // Create and append the partition dropdown
    const partitionDropdown = createDropdown('partitionDropdown', '60px');
    graphContainer.appendChild(partitionDropdown);

    // Create and append the namespace dropdown
    const namespaceDropdown = createDropdown('namespaceDropdown', '90px');
    graphContainer.appendChild(namespaceDropdown);

    // Populate the dropdowns with data
    populateDropdown(partitionDropdown, partitionData, "partition");
    populateDropdown(namespaceDropdown, namespaceData, "namespace");


    // Add event listeners to the dropdowns
    partitionDropdown.addEventListener('change', function() {
        console.log("in parition")
        highlightNodes(this.value, "Partition", nodes);
    });

    namespaceDropdown.addEventListener('change', function() {
        highlightNodes(this.value, "Namespace", nodes);
    });

    // Function to highlight nodes based on partition/namespace
    function highlightNodes(value, type, nodes) {

        if (value === "all") {
            // Reset all nodes to normal size
            nodes.forEach(node => {
                if (node.group == "service") {
                    nodes.update({
                        id: node.id,
                        color: "yellow",
                        shape: 'dot',
                        size: 30,
                        font: {
                            size: 32,
                            color: '#FFFFFF'
                        },
                        borderWidth: 2
                    });
                }
            });
        } else {
            nodes.forEach(node => {
                console.log(`node.data[${type}]:`, node.data[type]);
                if (node.group == "service") {
                    console.log(value)
                    if (node.data[type] && node.data[type] == value) {
                        // Highlight by increasing size and changing color
                        console.log(`Updating size for node id ${node.id}`);
                        nodes.update({
                            id: node.id,
                            size: 50,
                            color: "yellow",
                            borderWidth: 6,
                            font: {
                                size: 32,
                                color: '#FFFFFF'
                            },
                        });
                    } else {
                        // Set other nodes to normal size
                        nodes.update({
                            id: node.id,
                            color: "yellow",
                            shape: 'dot',
                            size: 30,
                            font: {
                                size: 32,
                                color: '#FFFFFF'
                            },
                            borderWidth: 2
                        });
                    }
                }
            });
        }
    }

    // Create and append the legend panel
    const legendPanel = document.createElement('div');
    legendPanel.id = 'legendPanel';
    legendPanel.style.position = 'absolute';

    legendPanel.style.bottom = '10px';
    legendPanel.style.right = '10px';
    legendPanel.style.padding = '10px';

    // legendPanel.style.top = '120px';
    // legendPanel.style.left = '10px';
    // legendPanel.style.padding = '10px';
    legendPanel.style.backgroundColor = '#fff';
    legendPanel.style.border = '1px solid #ccc';

    // Create the legend content
    const legendContent = `
  <p><b>Legend</b></p>
  <div><span style="display:inline-block;width:20px;height:20px;background-color:blue;"></span> Organization</div>
  <div><span style="display:inline-block;width:20px;height:20px;background-color:red;"></span> Cluster</div>
  <div><span style="display:inline-block;width:20px;height:20px;background-color:green;"></span> Node</div>
  <div><span style="display:inline-block;width:20px;height:20px;background-color:yellow;"></span> Service</div>
`;

    // Set the legend content
    legendPanel.innerHTML = legendContent;

    // Append the legend panel to the graph container
    graphContainer.appendChild(legendPanel);

    console.log(namespaceData);


}




// Function to clear the cached data
function clearCache() {
    localStorage.removeItem('graphData');
}



// Create the reload button element
const reloadButton = document.createElement('button');
reloadButton.innerText = 'Clear Cache';
reloadButton.style.position = 'absolute';
reloadButton.style.top = '10px';
reloadButton.style.left = '10px';
reloadButton.style.padding = '5px';
reloadButton.style.backgroundColor = '#fff';
reloadButton.style.border = '1px solid #ccc';
reloadButton.style.cursor = 'pointer';
// reloadButton.style.fontWeight = 'bold';
reloadButton.style.color = '#333';


// Function to hide the reload button
function hideReloadButton() {
    reloadButton.style.visibility = 'hidden';
}

// Function to show the reload button
function showReloadButton() {
    reloadButton.style.visibility = 'visible';
}

// Add a click event listener to the reload button
reloadButton.addEventListener('click', async () => {
    clearCache();
    // hideReloadButton();
    // resetGraph();
    // showLoadingMessage();
    // try {
    //     await fetchData(); // calling fetchData instead of '/api/data'
    //     showReloadButton();

    // } catch (error) {
    //     console.error('There has been a problem with your fetch operation:', error);
    //     showReloadButton();
    // }
});

function resetGraph() {
    const graphContainer = document.getElementById('mynetwork');
    while (graphContainer.firstChild) {
        graphContainer.firstChild.remove();
    }
}

// Function to show the loading message
function showLoadingMessage() {
    const loadingMessage = document.createElement('div');
    loadingMessage.innerText = 'Graph incoming in T-minus 30 seconds (give or take)....';
    loadingMessage.style.position = 'absolute';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '30%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.fontWeight = 'bold';
    loadingMessage.style.fontSize = '24px';
    loadingMessage.style.color = '#333';

    const graphContainer = document.getElementById('mynetwork');
    graphContainer.appendChild(loadingMessage);

    // Add a spinner animation
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    loadingMessage.appendChild(spinner);
}

// Function to hide the loading message
function hideLoadingMessage() {
    const loadingMessage = document.querySelector('#mynetwork > div');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// Initial data fetch
fetchData();