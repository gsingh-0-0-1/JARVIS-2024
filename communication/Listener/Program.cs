using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

class Server
{
    static TcpListener server;

    private static Dictionary<string, NetworkStream> clients = new Dictionary<string, NetworkStream>();
    private static object lockObject = new object();

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

    void HandleClient()
    {
        string clientId = ReadString();
        Console.WriteLine($"Client is named {clientId}");
        
        lock (lockObject)
        {
            clients.Add(clientId, stream);
        }

        while (true)
        {
            string reciever;
            try {
                reciever = ReadString();
            } catch (SocketException e) {
                break;
            }
            Console.WriteLine($"{clientId} Received: {reciever}");
            if (clients.ContainsKey(reciever)) {
                Console.WriteLine("Valid key");
                string message;
                try
                {
                    message = ReadString();
                }
                catch (SocketException e)
                {
                    break;
                }
                SendString(reciever, message);
            } else {
                Console.WriteLine("Invalid key");
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

    static void SendString(string client, string str) {
        Stream stream = clients[client];

        byte[] data = Encoding.ASCII.GetBytes(str);
        stream.Write(data, 0, data.Length);
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
