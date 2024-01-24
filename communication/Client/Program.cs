using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using Microsoft.VisualBasic;

using JSONClasses;

class Client
{
    static TcpClient client;
    static NetworkStream stream;

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
            string message;
            try {
                message = await ReadJson();
            } catch (SocketException e) {
                break;
            }

            Console.WriteLine($"Received: {message}");
        }
        Console.WriteLine("Diconnected from sever :(");
        Environment.Exit(Environment.ExitCode);
    }

    static void SendMessages()
    {
        Console.WriteLine("Enter name:");
        SendString(Console.ReadLine());
        while (true)
        {
            Console.WriteLine("Enter other client name:");
            string clientName = Console.ReadLine();
            SendJsonAsync(clientName);
        }
    }

    static void SendString(string str) {
        byte[] data = Encoding.ASCII.GetBytes(str);
        stream.Write(data, 0, data.Length);
        stream.Flush();
    }

    static async void SendJsonAsync(string clientName) {
        InformationJSON json = new InformationJSON
        {
            reciever = clientName,
            information = "Hello!"
        };

        await JsonSerializer.SerializeAsync(stream, json);
    }


    static async Task<string> ReadJson() {
        byte[] buffer = new byte[1024];
        int bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length);
        if (bytesRead == 0) {
            throw new SocketException();
        }

        string jsonString = Encoding.UTF8.GetString(buffer, 0, bytesRead);
        return jsonString;
    }

}
