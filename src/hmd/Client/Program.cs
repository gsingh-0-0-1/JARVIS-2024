using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

class Client
{
    private static TcpClient client = null!;
    private static NetworkStream stream = null!;

    static void Main()
    {
        client = new TcpClient(IPAddress.Loopback.ToString(), 1234);
        stream = client.GetStream();

        Task recieveMessages = ReceiveMessagesAsync();

        Thread sendThread = new Thread(SendMessages);

        sendThread.Start();
    }

    static async Task ReceiveMessagesAsync() {
        while (true)
        {
            JsonNode message;
            try {
                message = await ReadJson();
            } catch (SocketException) {
                break;
            }

            Console.WriteLine($"Received: {message}");
        }
        Console.WriteLine("Diconnected from sever :(");
        Environment.Exit(Environment.ExitCode);
    }

    static async void SendMessages()
    {
        Console.WriteLine("Enter name:");
        SendString(Console.ReadLine()!);
        while (true)
        {
            Console.WriteLine("Enter other client name:");
            string clientName = Console.ReadLine()!;
            await SendJsonAsync(clientName);
        }
    }

    static void SendString(string str) {
        byte[] data = Encoding.ASCII.GetBytes(str);
        stream.Write(data, 0, data.Length);
    }

    static async Task SendJsonAsync(string clientName) {
        var json = new { reciever = clientName, information = "Hello!" };

        string jsonString = JsonSerializer.Serialize(json);
        byte[] data = Encoding.UTF8.GetBytes(jsonString);
        byte[] lengthPrefix = BitConverter.GetBytes(data.Length);

        await stream.WriteAsync(lengthPrefix, 0, lengthPrefix.Length);
        await stream.WriteAsync(data, 0, data.Length);
    }


    static async Task<JsonNode> ReadJson() {
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

}
