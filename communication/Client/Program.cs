using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

class Client
{
    static TcpClient client;
    static NetworkStream stream;

    static void Main()
    {
        client = new TcpClient(IPAddress.Loopback.ToString(), 1234);
        stream = client.GetStream();

        Thread receiveThread = new Thread(ReceiveMessages);
        Thread sendThread = new Thread(SendMessages);

        receiveThread.Start();
        sendThread.Start();
    }

    static void ReceiveMessages()
    {
        while (true)
        {
            byte[] data = new byte[256];
            int bytesRead = stream.Read(data, 0, data.Length);
            if (bytesRead == 0) {
                break;
            }
            string message = Encoding.ASCII.GetString(data, 0, bytesRead);
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
            string messageToSend = Console.ReadLine();
            SendString(messageToSend);
            Console.WriteLine($"Sent: {messageToSend}");
        }
    }

    static void SendString(string str) {
        byte[] data = Encoding.ASCII.GetBytes(str);
        stream.Write(data, 0, data.Length);
    }
}
