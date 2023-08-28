# Consul Service Mesh Topology Visualization Tool 🎉

<img width="1714" alt="image" src="https://github.com/hashicorp/consul-cloud-api-topology/assets/84232154/6bc2eb3a-a11b-45f0-a894-4e6a8ad248d0">

This application is designed to visualize the topology of your Consul Service Mesh. It provides a dynamic, interactive map of your service mesh infrastructure. With this tool, you can get a clear overview of the services in your mesh and how they interact with each other.

The tool works by fetching data from various Consul cloud API endpoints(Currently being built) and using this data to generate a network graph that displays the hierarchy and relationships among various entities such as organizations, projects, clusters, nodes, and services in your Consul service mesh.

## Features 🚀

- **Dynamic visualization**: Interact with the service mesh topology, gain insight into the relationships between the nodes, services and between services. You can also visualize services belonging to a Admin partition or a namespace.

- **Details on demand**: Click on any node in the graph to view detailed information about the entity, such as associated service instances for a service node.

- **Show and hide functionality**: Double-click on any node to hide or show its child entities. This helps in focusing on specific parts of the mesh, enabling efficient and targeted troubleshooting.

- **Persistent Node Positions**: The positions of nodes are saved in local storage. So, when you reload the page, the layout of the graph remains the same.

- **Real-time Cluster Pull and Mocked Data Modes**: The application can run using data from a live cluster or using mocked data. This gives you the flexibility to model and visualize hypothetical scenarios or analyze real-time data. In real time cluster Pull mode, It converts the underlying Consul Cluster HTTP APIs to the Consul Cloud APIs format needed to render the graph. Over the period of time, once we have the actual Consul Cloud Public APIs we can connect UI to that instead of Mock Data. 

- **Reload data from cluster**: In real-time cluster pull mode, once the graph is loaded, we cache it in browser as pulling data from cluster every time is expensive. If you still want to forcefully pull the data from clusters click on the `Clear Cache` button and refresh the page.

## Understanding Consul Service Mesh Domain Objects 📚

The Visualization Tool reflects the following entities from your Consul Service Mesh:

1. **Organization**: Represents the highest level of grouping of your infrastructure, which may include multiple projects.

2. **Project**: This is a logical group within an organization, encapsulating specific services in your application. Projects can have multiple clusters associated with them.

3. **Cluster**: Collection of interconnected nodes that work together as part of a distributed system. These nodes can be servers or clients.

4. **Node**: In a service mesh, a node is an individual machine (physical or virtual) within a cluster where the services run.

5. **Service**: A service is an application or a function that performs a specific task. Services communicate with each other within the mesh. In Consul, each service has a unique name and ID and can have multiple service instances.

6. **Service Instance**: A service instance is a single running copy of a service. There can be multiple instances of a service running on different nodes for redundancy and load balancing.

7. **Intention**: In Consul, intentions are rules that govern whether one service may communicate with another. They are used to configure access control between services and are a core feature of Consul's service mesh capabilities. Intentions can be used to manage service-to-service communication and enforce security policies within your mesh.

8.  **Admin Partitions & Namespaces**: Partitions allow multiple independent tenants to share a Consul server cluster. Namespaces are useful for isoloating data for different users or teams.

These entities form the core components of your service mesh topology and their understanding is crucial in managing and navigating your Consul service mesh. 

## Consul Cloud API Endpoints used for rendering this UI
- GET /organizations/:orgId/projects/:projectId/clusters
- GET /organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes
- GET /organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes/:nodeId/services
- GET /organizations/:orgId/projects/:projectId/clusters/:clusterId/nodes/:nodeId/services/:serviceId/instances
- GET /organizations/:orgId/projects/:projectId/clusters/:clusterId/intentions
- GET /organizations/:orgId/projects/:projectId/clusters/:clusterId/partitions
- GET /organizations/:orgId/projects/:projectId/clusters/:clusterId/namespaces

## Some Future Ideas
- Overlay Service to service Observability metrics.
- Add further ability to visualize Admin partitions, namespaces (its corresponding ACLs etc)
- Add "walk the graph" functionality, where i can start with only one node (say organization) click it to show its immediate children and so on.
- Search by name and go to that node directly (could be a node, service, etc). Search could be further extended by searching even attributes of a node.
- Create a live graph 🚀
- Add ability to configure visual elements (themes). This could be shape of different nodes, color, size, background, font etc.

## Prerequisites 📋

You need to have Node.js and npm installed on your machine. This project was built using Node.js version `19.7.0` and npm version 9.5.0. Information about how to install Node.js and npm can be found [here](https://nodejs.org/en/download/).

## Getting Started 🚀

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

1. **Clone the repo:**

    ```bash
    git clone <REPO_URL>
    ```
    
2. **Install NPM packages:**

    ```bash
    npm install
    ```

3. **Configure the server:**

    If you want to use the server fetching real-time data from the HashiCorp Consul API, create a .env file in the root directory and add the following:

    ```bash
    CONSUL_API=<Your Consul API base URL>
    ACL_TOKEN=<Your Consul ACL token>
    ```
    Replace `<Your Consul API base URL>` and `<Your Consul ACL token>` with your actual Consul API base URL and Consul ACL token.

    If you want to use the server mocking data, no .env file is needed. The server uses static JSON files to mock the data.

4. **Run the server:**

    If you want to use the server fetching real-time data from the HashiCorp Consul API, run the following command:
    ```bash
    node app-cluster.js
    ```
    If you want to use the server mocking data, run the following command:
    ```bash
    node app-mock.js
    ```
    
    The server will start on port 3000. Open your browser and visit:
    ```bash
    http://localhost:3000
    ```

## Built With 🛠️

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [node-fetch](https://www.npmjs.com/package/node-fetch)

## Authors 👤

- Trilok Ramakrishna (Github Alias: 3loka)

## License 📄

TBD

## Acknowledgments 🎁

- Hat tip to anyone whose code was used
- Inspiration
- etc.

# Sample screenshot 
<img width="1724" alt="image" src="https://github.com/hashicorp/consul-cloud-api-topology/assets/84232154/7507a08a-530d-4cb3-901a-ff0b8056e83a">


