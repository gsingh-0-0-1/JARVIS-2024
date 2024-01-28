using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

class Server
{
    private static TcpListener server = null!;

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
        string clientId;
        try {
            clientId = ReadString();
        } catch (SocketException) {
            Console.WriteLine("Client disconnected");
            return;
        }

        // TODO Check if client is already in dictonary. Idk if needed.
        Console.WriteLine($"Client is named {clientId}");
        
        lock (lockObject)
        {
            clients.Add(clientId, stream);
        }

        while (true)
        {
            JsonNode recievedInformation;
            try {
                recievedInformation = await ReadJson();
            } catch (SocketException) { break; }

            var options = new JsonSerializerOptions { WriteIndented = true };
            string prettyJsonString = JsonSerializer.Serialize(recievedInformation, options);
            Console.WriteLine(prettyJsonString);

            recievedInformation["sender"] = clientId;
            if (clients.ContainsKey(recievedInformation["reciever"]!.GetValue<string>())) {
                await SendJsonAsync(recievedInformation);
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

    async Task SendJsonAsync(JsonNode json) {
        NetworkStream stream = clients[json["reciever"]!.GetValue<string>()];

        string jsonString = JsonSerializer.Serialize(json);
        byte[] data = Encoding.UTF8.GetBytes(jsonString);
        byte[] lengthPrefix = BitConverter.GetBytes(data.Length);

        await stream.WriteAsync(lengthPrefix, 0, lengthPrefix.Length);
        await stream.WriteAsync(data, 0, data.Length);
    }


    async Task<JsonNode> ReadJson() {
        int bufferLengthRecieved;

        byte[] lengthBuffer = new byte[4];
        bufferLengthRecieved = await stream.ReadAsync(lengthBuffer, 0, lengthBuffer.Length);
        if (bufferLengthRecieved == 0) { throw new SocketException(); }
        int messageLength = BitConverter.ToInt32(lengthBuffer, 0);

        byte[] buffer = new byte[messageLength];
        bufferLengthRecieved = await stream.ReadAsync(buffer, 0, buffer.Length);
        if (bufferLengthRecieved == 0) { throw new SocketException(); }

        JsonNode recievedInformation = JsonSerializer.Deserialize<JsonNode>(buffer)!;

        return recievedInformation;
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
