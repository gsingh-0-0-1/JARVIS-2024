using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;

using JSONClasses;

class Server
{
    static TcpListener server;

    private static Dictionary<string, NetworkStream> clients = new Dictionary<string, NetworkStream>();
    private static readonly object lockObject = new object();

    private TcpClient client;
    private NetworkStream stream;

    static void Main()
    {
        int port = 1234;
//        IPAddress ipAddress = GetLocalIPAddress();
        IPAddress ipAddress = IPAddress.Loopback;

        server = new TcpListener(ipAddress, port);
        server.Start();

        Console.WriteLine($"Server listening on IP address {ipAddress} and port {port}");
        Console.WriteLine("Waiting for a connection...");

        while (true) {

            TcpClient client = server.AcceptTcpClient();
            Console.WriteLine("Connected!");

            Server serverHandler = new Server(client);

            Thread clientThread = new Thread(serverHandler.HandleClient);
            clientThread.Start();
        }
    }

    Server(TcpClient client) {
        this.client = client;
        this.stream = client.GetStream();
    }

    async void HandleClient()
    {
        string clientId = ReadString();
        Console.WriteLine($"Client is named {clientId}");
        
        lock (lockObject)
        {
            clients.Add(clientId, stream);
        }

        while (true)
        {
            string recieved;
            try {
                recieved = await ReadJson();
            } catch (SocketException e) {
                break;
            }
            Console.WriteLine($"{clientId}:");
            InformationJSON recievedInformation = JsonSerializer.Deserialize<InformationJSON>(recieved)!;

            var options = new JsonSerializerOptions { WriteIndented = true };
            string prettyJsonString = JsonSerializer.Serialize(recievedInformation, options);
            Console.WriteLine(prettyJsonString);

            recievedInformation.sender = clientId;

            if (clients.ContainsKey(recievedInformation.reciever)) {
                SendJsonAsync(recievedInformation);
            }
            
        }
        Console.WriteLine($"Client {clientId} disconnected");

        lock (lockObject)
        {
            clients.Remove(clientId);
        }
    }

    string ReadString() {
        byte[] data = new byte[256];
        int bytesRead = stream.Read(data, 0, data.Length);
        if (bytesRead == 0)
        {
            throw new SocketException();
        }
        string message = Encoding.ASCII.GetString(data, 0, bytesRead);
        return message;
    }

    async void SendJsonAsync(InformationJSON informationJSON) {
        NetworkStream stream = clients[informationJSON.reciever];

        await JsonSerializer.SerializeAsync(stream, informationJSON);
    }

    async Task<string> ReadJson() {
        byte[] buffer = new byte[1024];
        int bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length);
        if (bytesRead == 0) {
            throw new SocketException();
        }

        string jsonString = Encoding.UTF8.GetString(buffer, 0, bytesRead);
        return jsonString;
    }

    static IPAddress GetLocalIPAddress()
    {
        IPAddress[] localIPs = Dns.GetHostAddresses(Dns.GetHostName());
        foreach (IPAddress ipAddress in localIPs)
        {
            if (ipAddress.AddressFamily == AddressFamily.InterNetwork)
            {
                return ipAddress;
            }
        }
        return IPAddress.Loopback;
    }
}
